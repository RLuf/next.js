import fs from "fs";

function readMatches(name: string) {
  return fs.readFileSync("./.next/" + name);
}

export default function Page({ searchParams }: { searchParams: any }) {
  return (
    <h1>
      Hello, Next.js!
      {readMatches(searchParams.name ?? "BUILD_ID").length}
    </h1>
  );
}
