import { readAsArrayBuffer } from "../common/readers";
import { AbortError } from "../common/errors";

const downloadProject = async (buffer, progressCallback, pid = 0) => {
    const controller =
        typeof AbortController === "function" && new AbortController();
    const downloadProject = await import(
        /* webpackChunkName: "downloader" */ "./download-project.js"
    );
    let reject;
    return {
        promise: new Promise((_resolve, _reject) => {
            reject = _reject;

            downloadProject
                .downloadProject(
                    buffer,
                    progressCallback,
                    controller && controller.signal,
                    pid,
                )
                .then((result) => _resolve(result))
                .catch((err) => _reject(err));
        }),

        terminate: () => {
            reject(new AbortError());
            if (controller) {
                controller.abort();
            }
        },
    };
};

const fromFile = async (file, progressCallback) => {
    const buffer = await readAsArrayBuffer(file);
    return downloadProject(buffer, progressCallback);
};

export default {
    fromFile,
};
