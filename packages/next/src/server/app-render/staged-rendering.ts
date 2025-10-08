import { InvariantError } from '../../shared/lib/invariant-error'
import { createPromiseWithResolvers } from '../../shared/lib/promise-with-resolvers'

export enum RenderStage {
  Static = 1,
  Runtime = 2,
  Dynamic = 3,
}

export type NonStaticRenderStage = RenderStage.Runtime | RenderStage.Dynamic

export class StagedRenderingController {
  currentStage: RenderStage = RenderStage.Static

  private runtimeStagePromise = createPromiseWithResolvers<void>()
  private dynamicStagePromise = createPromiseWithResolvers<void>()

  constructor(abortSignal?: AbortSignal) {
    if (abortSignal) {
      abortSignal.addEventListener(
        'abort',
        () => {
          const { reason } = abortSignal
          if (this.currentStage < RenderStage.Runtime) {
            this.runtimeStagePromise.reject(reason)
          }
          if (this.currentStage < RenderStage.Dynamic) {
            this.dynamicStagePromise.reject(reason)
          }
        },
        { once: true }
      )
    }
  }

  advanceStage(stage: NonStaticRenderStage) {
    // If we're already at the target stage or beyond, do nothing.
    // (this can happen e.g. if sync IO advanced us to the dynamic stage)
    if (this.currentStage >= stage) {
      return
    }
    this.currentStage = stage
    // Note that we might be going directly from Static to Dynamic,
    // so we need to resolve the runtime stage as well.
    if (stage >= RenderStage.Runtime) {
      this.runtimeStagePromise.resolve()
    }
    if (stage >= RenderStage.Dynamic) {
      this.dynamicStagePromise.resolve()
    }
  }

  delayUntilStage<T>(stage: NonStaticRenderStage, resolvedValue: T) {
    let promise: Promise<void>
    switch (stage) {
      case RenderStage.Runtime: {
        promise = this.runtimeStagePromise.promise
        break
      }
      case RenderStage.Dynamic: {
        promise = this.dynamicStagePromise.promise
        break
      }
      default: {
        stage satisfies never
        throw new InvariantError(`Invalid render stage: ${stage}`)
      }
    }

    // FIXME: this seems to be the only form that leads to correct API names
    // being displayed in React Devtools (in the "suspended by" section).
    // If we use `promise.then(() => resolvedValue)`, the names are lost.
    // It's a bit strange that only one of those works right.
    return new Promise<T>((resolve, reject) => {
      promise.then(resolve.bind(null, resolvedValue), reject)
    })
  }
}
