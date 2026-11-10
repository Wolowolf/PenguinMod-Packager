<script>
  import {createEventDispatcher} from 'svelte';
  import {_} from '../locales/';
  import icon from './reset.svg';

  const dispatch = createEventDispatcher();

  const click = () => {
    if (confirm($_('reset.confirm'))) {
      dispatch('click');
    }
  };
</script>

<style>
  button {
    width: 26px;
    height: 26px;
    margin: 0;
    padding: 4px;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 4px;
  }
  /* section 223: the card's hover tint and ink */
  button:hover {
    background: var(--hover-on-panel, rgba(127, 127, 127, 0.2));
  }
  button:active {
    background: color-mix(in srgb, var(--text-on-panel, #7f7f7f) 25%, transparent);
  }
  .icon {
    display: block;
    width: 100%;
    height: 100%;
    background-color: var(--text-on-panel, currentColor);
    mask: var(--icon) center / 100% no-repeat;
  }
</style>

<button on:click={click}>
  <span
    class="icon"
    style:--icon={`url("${icon}")`}
    role="img"
    aria-label={$_('reset.reset')}
    title={$_('reset.reset')}
  ></span>
</button>
