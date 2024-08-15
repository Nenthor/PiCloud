<script lang="ts">
  import { goto } from '$app/navigation';
  import { clipName } from '$lib/General';
  import { getFullPath } from '$lib/Path';

  export let path: string[];
  export let name: string;
  export let width: number;
  export let checkMode: 'delete' | 'download' | 'none';
  export let handleCheck: (name: string) => void;
  export let isChecked: boolean;

  function handleClick() {
    if (checkMode != 'none') handleCheck(name);
    else goto(getFullPath([...path, name])!);
  }
</script>

<li style="width: {width}px;">
  <a href={getFullPath([...path, name])} on:click|preventDefault={handleClick}>
    <div>
      {#if checkMode != 'none'}
        <div class="checkBox">
          {#if isChecked}
            <img src="/img/svg/square-checked.svg" alt="checked" />
          {:else}
            <img src="/img/svg/square-unchecked.svg" alt="unchecked" />
          {/if}
        </div>
      {/if}
      <slot />
    </div>
    <p>{clipName(name)}</p>
  </a>
</li>

<style>
  li {
    display: flex;
    justify-content: center;

    text-align: center;
    padding: 5px;
  }

  li:hover {
    background-color: #0003;
  }

  li > a {
    width: 100%;
    height: 100%;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    position: relative;
    border-radius: 10px;
  }

  li > a > div {
    position: relative;
    aspect-ratio: 16 / 9;
    width: 100%;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  li > a > p {
    color: #eee;
    max-width: 100%;
    line-break: anywhere;
  }

  .checkBox {
    position: absolute;
    aspect-ratio: 1 / 1;
    top: 5%;
    right: 5%;
    width: 15%;
    background-image: radial-gradient(circle, #0005 0%, #0005 50%, transparent 70%);
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
