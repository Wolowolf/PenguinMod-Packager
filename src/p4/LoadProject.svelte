<script>
  // PenguinMod Desktop (Section 68): the project is always the one in the editor that opened
  // this window (File → Package project); there is no way to choose another one.
  import {_} from '../locales';
  import Section from './Section.svelte';
  import ImportingProject from './ImportProject.svelte';
  import {progress, currentTask} from './stores';
  import loadProject from '../packager/load-project';
  import Task from './task';
  import importExternalProject from './import-external-project';

  export let projectData = null;

  let isImportingProject = false;

  const internalLoad = async (task, file) => {
    const progressCallback = (type, a, b) => {
      if (type === 'assets') {
        task.setProgressText(
          $_('progress.loadingAssets')
            .replace('{complete}', a)
            .replace('{total}', b)
        );
        task.setProgress(a / b);
      } else if (type === 'compress') {
        task.setProgressText($_('progress.compressingProject'));
        task.setProgress(a);
      }
    };
    task.setProgressText($_('progress.compressingProject'));
    const project = await (await loadProject.fromFile(file, progressCallback)).promise;
    return {
      projectId: null,
      uniqueId: `@${file.name}`,
      title: file.name,
      project
    };
  };

  const load = async (file) => {
    projectData = null;
    currentTask.abort();
    const task = new Task();
    projectData = await task.do(internalLoad(task, file));
    task.done();
  };

  importExternalProject({
    onStartImporting: () => {
      isImportingProject = true;
    },
    onCancelImporting: () => {
      isImportingProject = false;
    },
    onFinishImporting: (files) => {
      if (!isImportingProject) {
        // Import was cancelled.
        return;
      }
      isImportingProject = false;
      load(files[0]);
    }
  });
</script>

{#if isImportingProject}
  <ImportingProject on:cancel={() => {
    isImportingProject = false;
  }} />
{/if}

{#if !isImportingProject && !$progress.visible && !projectData}
  <Section caption>
    <p>{$_('load.openFromEditor')}</p>
  </Section>
{/if}
