<script>
  import {_} from '../locales/';
  import {fade} from 'svelte/transition';
  import Section from './Section.svelte';
  import LoadProject from './LoadProject.svelte';
  import SelectLocale from './SelectLocale.svelte';
  import SelectTheme from './SelectTheme.svelte';
  import Progress from './Progress.svelte';
  import Modals from './Modals.svelte';
  import News from './News.svelte';
  import {progress, theme, error} from './stores';
  import {isSupported, isSafari, isStandalone, version} from './environment';
  import {
    APP_NAME,
    ACCENT_COLOR,
    WEBSITE
  } from '../packager/brand';

  let projectData;

  const darkMedia = window.matchMedia('(prefers-color-scheme: dark)');
  let systemTheme = darkMedia.matches ? 'dark' : 'light';
  if (darkMedia.addEventListener) {
    darkMedia.addEventListener('change', () => {
      systemTheme = darkMedia.matches ? 'dark' : 'light';
    });
  }
  // PenguinMod Desktop (section 223): this window takes the editor's theme colours and light / dark
  // choice, which the editor saves in localStorage (its src/lib/pm-theme-colors.js); its variables are
  // used by the styles below, the old colours stay as fallbacks for a packager opened without them
  const EDITOR_THEME_KEY = 'pm:theme-vars';
  const readEditorTheme = () => {
    try {
      const value = JSON.parse(localStorage.getItem(EDITOR_THEME_KEY));
      if (value && (value.mode === 'light' || value.mode === 'dark') && value.vars && typeof value.vars === 'object') {
        return value;
      }
    } catch (e) {
      // ignore
    }
    return null;
  };
  let editorTheme = readEditorTheme();
  window.addEventListener('storage', (e) => {
    if (e.key === EDITOR_THEME_KEY || e.key === null) editorTheme = readEditorTheme();
  });
  const editorThemeStyle = document.createElement('style');
  document.head.appendChild(editorThemeStyle);
  const editorThemeCSS = (value) => {
    if (!value) return '';
    const lines = Object.keys(value.vars)
      .filter((name) => /^--[a-z0-9-]+$/.test(name) && typeof value.vars[name] === 'string' &&
        value.vars[name] !== '' && !/[;{}<>]/.test(value.vars[name]))
      .map((name) => `  ${name}: ${value.vars[name]};`);
    return `:root {${lines.join('')}}`;
  };
  $: editorThemeStyle.textContent = editorThemeCSS(editorTheme);
  $: document.documentElement.setAttribute('theme', editorTheme ? editorTheme.mode :
    ($theme === 'system' ? systemTheme : $theme));

  let modalVisible = false;

  const defaultTitle = document.title;
  let title = '';
  $: document.title = projectData && title ? `${title} - ${APP_NAME}` : defaultTitle;

  const getPackagerOptionsComponent = () => import(
    /* webpackChunkName: "packager-options-ui" */
    './PackagerOptions.svelte'
  ).catch((err) => {
    $error = err;
  });

  // We know for sure we will need this component very soon, so start loading it immediately.
  getPackagerOptionsComponent();
</script>

<style>
  /* section 223: the page is the editor's frame, cards are panels, fields are the workspace */
  :root {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    background: var(--ui-primary, white);
    color: var(--text-on-background, black);
    accent-color: var(--ui-accent, auto);
    scrollbar-color: var(--ui-edge, auto) var(--ui-primary, auto);
  }
  :global([theme="dark"]) {
    background: var(--ui-primary, #111);
    color: var(--text-on-background, #eee);
    color-scheme: dark;
  }
  :global(a) {
    color: var(--accent-on-panel, blue);
  }
  :global([theme="dark"] a) {
    color: var(--accent-on-panel, #56b2ff);
  }
  :global(footer a) {
    color: var(--accent-on-background, inherit);
  }
  :global(a:active) {
    color: var(--stop-on-panel, red);
  }
  :global(input[type="text"]),
  :global(input[type="number"]),
  :global(textarea) {
    padding: 2px;
  }
  :global(input[type="text"]),
  :global(input[type="number"]),
  :global(textarea),
  :global(.is-not-safari select) {
    background-color: var(--ui-workspace, white);
    color: var(--text-on-workspace, black);
    border: 1px solid var(--ui-edge, rgb(160, 160, 160));
    border-radius: 2px;
  }
  :global(.is-not-safari select:hover) {
    border-color: var(--text-dim-on-workspace, rgb(30, 30, 30));
  }
  :global([theme="dark"] input[type="text"]),
  :global([theme="dark"] input[type="number"]),
  :global([theme="dark"] textarea),
  :global([theme="dark"] .is-not-safari select) {
    background-color: var(--ui-workspace, #333);
    color: var(--text-on-workspace, white);
    border-color: var(--ui-edge, #888);
  }
  :global([theme="dark"] .is-not-safari select:hover) {
    border-color: var(--text-dim-on-workspace, #bbb);
  }
  :global(p), :global(h1), :global(h2), :global(h3) {
    margin: 12px 0;
  }
  :global(summary) {
    cursor: pointer;
  }
  :global(input) {
    font-size: 0.8em;
  }
  main {
    padding-bottom: 10px;
  }
  footer {
    text-align: center;
  }
  footer > div {
    margin-top: 12px;
  }
  .disclaimer {
    font-style: italic;
  }
  .version {
    font-size: small;
    opacity: 0.8;
  }
  .version a {
    color: inherit;
  }
</style>

<Modals bind:modalVisible={modalVisible} />

<main aria-hidden={modalVisible} class:is-not-safari={!isSafari}>
  <Section accent={ACCENT_COLOR}>
    <div>
      <h1>{APP_NAME}</h1>
      {#if version}
        <p class="version">
          {version}
          {#if isStandalone}
            - <a href={WEBSITE}>{WEBSITE}</a>
          {/if}
        </p>
      {/if}
      <p>{$_('p4.description1')}</p>
      <!-- PenguinMod Desktop: no "embedding" paragraph and (footer) no privacy policy or documentation
           links: they open turbowarp.org pages, which the app refuses (upstream servers). -->
      <!-- PenguinMod Desktop (Section 29): no "Report bugs ... on Discord or on GitHub" line. -->
      <p class="disclaimer">
        {$_('p4.disclaimer')}
      </p>
    </div>
  </Section>

  {#if !isStandalone}
    <News />
  {/if}

  {#if isSupported}
    <LoadProject bind:projectData />
  {:else}
    <Section accent="#4C97FF">
      <h2>{$_('p4.browserNotSupported')}</h2>
      <p>{$_('p4.browserNotSupportedDescription')}</p>
    </Section>
  {/if}

  {#if projectData}
    {#await getPackagerOptionsComponent()}
      <Section center>
        <Progress text={$_('p4.importingInterface')} />
      </Section>
    {:then { default: PackagerOptions }}
      <div in:fade>
        <PackagerOptions
          projectData={projectData}
          bind:title={title}
        />
      </div>
    {:catch}
      <Section center>
        <p>
          {$_('p4.unknownImportError')}
        </p>
      </Section>
    {/await}
  {/if}

  {#if $progress.visible}
    <Section center>
      <Progress progress={$progress.progress} text={$progress.text} />
    </Section>
  {/if}

  <footer>
    <div>
      <!-- PenguinMod Desktop (Section 29): no Feedback (Discord), Source code (GitHub) or Donate links. -->
    </div>
    <div>
      {#if !editorTheme}
        <!-- section 223: the editor's theme decides when there is one -->
        <SelectTheme />
      {/if}
    </div>
    <div>
      <SelectLocale />
    </div>
  </footer>
</main>
