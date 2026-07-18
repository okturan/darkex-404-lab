# Security policy

## Reporting a vulnerability

Please use [GitHub private vulnerability reporting](https://github.com/okturan/darkex-404-lab/security/advisories/new). Do not open a public issue with an exploit before a fix or mitigation is available.

Include the affected page, release artifact or commit, browser and graphics backend when relevant, and a minimal reproduction. Reports are most useful when they cover one of these repository-owned boundaries:

- script or markup injection in the gallery, demo pages, or self-contained release artifact;
- unsafe handling of configurable copy, CSS values, logo markup, or `window.DARKEX404` settings;
- a build or release-integrity problem that changes the shipped archive unexpectedly;
- a dependency or fallback-path issue that this project can mitigate directly.

This is a static visual experiment with no accounts, database, API, or private user data. Expected GPU load, a browser-specific rendering defect, the documented WebGPU-to-WebGL2 fallback, and the absence of motion when `prefers-reduced-motion` is enabled are not security vulnerabilities by themselves. Browser, GPU-driver, and three.js defects should go upstream unless this repository's code creates or can reasonably contain the problem.

The current default branch and latest listed release are supported. I will investigate private reports and coordinate disclosure after a fix or clear mitigation is available. No response-time or remediation-time guarantee is implied.

## Safe testing

Use the local development server or your own deployment. Do not test against third-party Darkex properties or attempt to interfere with other visitors.
