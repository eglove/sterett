import { projectBuilder } from "@ethang/project-builder/project-builder.js";

await projectBuilder("sterett", "main", {
  preVersionBumpScripts: ["UPDATE", "PRUNE"],
  postVersionBumpScripts: ["DEDUPE", "LINT", "BUILD"],
  isIgnoringBuild: true,
  isIgnoringPeerDependencies: true,
});
