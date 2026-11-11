import { profile } from "../../src/data/profile";
import { basePathOf, withBasePath } from "../../src/lib/basePath";

/**
 * The resume is served under a base path (/resume), and the test server
 * serves dist/ the same way, so tests visit and fetch prefixed URLs.
 */
export const basePath = basePathOf(profile.siteUrl);

/** The resume's home page, e.g. "/resume/". */
export const resumeHome = `${basePath}/`;

/** A file from `public/` at the URL it's served at, e.g. "/resume/resume.pdf". */
export const asset = (path: string) => withBasePath(profile.siteUrl, path);
