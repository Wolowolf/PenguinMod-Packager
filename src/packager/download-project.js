import optimizeSb3Json from "./minify/sb3";
import { downloadProjectFromBuffer } from "@turbowarp/sbdl";

const unknownAnalysis = () => ({
    stageVariables: [],
    stageComments: [],
    usesMusic: true,
    extensions: [],
    builtInExts: [],
    speech: null,
});

// PenguinMod Desktop (Section 96): the Text To Speech languages and voices the project's blocks
// use, so a package holds only those speech files. English and alba are the defaults, so always
// in; a reporter in a set voice block's voice or language menu means all of them (voices: null). A Supertonic
// voice (or a reporter) adds the Supertonic model (supertonic: true); languages lists Pocket's only, from
// blocks whose voice is a Pocket voice or a reporter.
const SPEECH_ID = "pmTextToSpeech";
const SPEECH_LANGUAGES = ["english", "french", "german", "italian", "portuguese", "spanish"];
const analyzeSpeech = (projectData) => {
    let used = false;
    const languages = new Set(["english"]);
    let voices = new Set(["alba"]);
    let supertonic = false;
    for (const target of projectData.targets) {
        const blocks = target.blocks || {};
        const menuValue = (block, inputName, fieldName) => {
            const input = block.inputs && block.inputs[inputName];
            if (!input || input[0] !== 1 || typeof input[1] !== "string") return null;
            const menu = blocks[input[1]];
            const field = menu && menu.fields && menu.fields[fieldName];
            return field ? String(field[0]).toLowerCase().trim() : null;
        };
        for (const block of Object.values(blocks)) {
            if (!block || Array.isArray(block) || typeof block.opcode !== "string") continue;
            if (!block.opcode.startsWith(`${SPEECH_ID}_`)) continue;
            used = true;
            if (block.opcode === `${SPEECH_ID}_setVoice`) {
                const voice = menuValue(block, "VOICE", "voices");
                if (voice === null || !voice.startsWith("supertonic ")) {
                    const language = menuValue(block, "LANGUAGE", "languages");
                    if (language === null) SPEECH_LANGUAGES.forEach((l) => languages.add(l));
                    else if (SPEECH_LANGUAGES.includes(language)) languages.add(language);
                }
                if (voice === null) {
                    voices = null;
                    supertonic = true;
                } else if (voice.startsWith("supertonic ")) supertonic = true;
                else if (voices) voices.add(voice);
            }
        }
    }
    if (!used) return null;
    return {
        languages: SPEECH_LANGUAGES.filter((l) => languages.has(l)),
        voices: voices && Array.from(voices),
        supertonic,
    };
};

const analyzeScratch2 = (projectData) => {
    const stageVariables = (projectData.variables || []).map(
        ({ name, isPersistent }) => ({
            name,
            isCloud: isPersistent,
        }),
    );
    // This may have some false positives, but that's okay.
    const stringified = JSON.stringify(projectData);
    const usesMusic =
        stringified.includes("drum:duration:elapsed:from:") ||
        stringified.includes("playDrum") ||
        stringified.includes("noteOn:duration:elapsed:from:");
    return {
        ...unknownAnalysis(),
        stageVariables,
        usesMusic,
    };
};

const analyzeScratch3 = (projectData) => {
    const stage = projectData.targets[0];
    if (!stage || !stage.isStage) {
        throw new Error("Project does not have stage");
    }
    const stageVariables = Object.values(stage.variables).map(
        ([name, _value, cloud]) => ({
            name,
            isCloud: !!cloud,
        }),
    );
    const stageComments = Object.values(stage.comments).map((i) => i.text);
    // TODO: usesMusic has possible false negatives
    const usesMusic =
        projectData.extensions && projectData.extensions.includes("music");
    const extensions = projectData.extensionURLs
        ? Object.values(projectData.extensionURLs)
        : [];
    const builtInExts = projectData.extensions;
    return {
        ...unknownAnalysis(),
        stageVariables,
        stageComments,
        usesMusic,
        extensions,
        builtInExts,
        speech: analyzeSpeech(projectData),
    };
};

const mutateScratch3InPlace = (projectData) => {
    const makeImpliedCloudVariables = (projectData) => {
        const stage = projectData.targets.find((i) => i.isStage);
        if (stage) {
            for (const variable of Object.values(stage.variables)) {
                const name = variable[0];
                if (name.startsWith("☁")) {
                    variable[2] = true;
                }
            }
        }
    };

    const disableNonsenseCloudVariables = (projectData) => {
        const DISABLE_CLOUD_VARIABLES = [
            // The "original" Sprunki project includes a cloud variable presumably used to detect who
            // clicked on the report button. That seems like a Scratch community guidelines violation but
            // that's not our job to enforce. This affects us because these games are very popular and
            // create thousands of unnecessary concurrent cloud variable connections for a feature that
            // can't work because there is no report button to click on.
            "☁ potential reporters",
        ];

        // I want a more general solution here that automatically disables all unused cloud variables,
        // but making that work in the presence of various unknown extensions seems non-trivial.

        const stage = projectData.targets.find((i) => i.isStage);
        if (stage) {
            for (const variable of Object.values(stage.variables)) {
                // variable is [name, value, isCloud]
                if (
                    variable[2] &&
                    DISABLE_CLOUD_VARIABLES.includes(variable[0])
                ) {
                    variable[2] = false;
                }
            }
        }
    };

    // Order matters -- check for implied cloud variables before disabling some of them.
    makeImpliedCloudVariables(projectData);
    disableNonsenseCloudVariables(projectData);
    optimizeSb3Json(projectData);
};

// The editor saves the extensions of the app's galleries by ID only (like built-in extensions).
// The packager needs their addresses to bake them into the package, so they are put back into
// the project data here, from the list the app serves (ID => gallery address).
const getGalleryExtensionURLs = async () => {
    try {
        const res = await fetch("https://studio.penguinmod.com/__extension-ids__.json");
        if (!res.ok) return {};
        return await res.json();
    } catch (e) {
        return {};
    }
};

const restoreGalleryExtensionURLs = (projectData, galleryURLs) => {
    if (!Array.isArray(projectData.extensions)) return;
    for (const id of projectData.extensions) {
        const url = galleryURLs[id];
        if (typeof url !== "string") continue;
        if (!projectData.extensionURLs) projectData.extensionURLs = {};
        if (!projectData.extensionURLs[id]) projectData.extensionURLs[id] = url;
    }
};

export const downloadProject = async (
    projectData,
    progressCallback = () => {},
    signal,
    pid = 0,
) => {
    let analysis = unknownAnalysis();
    const galleryURLs = await getGalleryExtensionURLs();

    const options = {
        signal,

        assetHost: `https://asset-cdn.penguinmod.com/file/penguinmod-warm-tier-s2-cf/${pid}_$id`,

        onProgress(type, loaded, total) {
            progressCallback(type, loaded, total);
        },

        processJSON(type, projectData) {
            if (type === "sb3" || type === "pm" || type === "pmp") {
                mutateScratch3InPlace(projectData);
                restoreGalleryExtensionURLs(projectData, galleryURLs);
                analysis = analyzeScratch3(projectData);
                return projectData;
            }
            if (type === "sb2") {
                analysis = analyzeScratch2(projectData);
            }
        },
    };

    const project = await downloadProjectFromBuffer(projectData, options);
    if (project.type !== "sb3" || project.type === "pm") {
        project.type = "blob";
    }
    project.analysis = analysis;
    return project;
};
