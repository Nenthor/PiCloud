<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  export let addHomeLink = true;

  const MOBILE_FLY_TRANSITION = 1000;
  let isOpen = false;
  let is_loading = true;
  let isMobileMenu = false;
  let total_width = 0,
    image_width = 0,
    list_width = 0;
  let isRoot = true;

  onMount(() => {
    setRedirect();
    window.addEventListener('resize', checkNavbarWidth);
  });

  $: if (total_width != 0 && image_width != 0 && list_width != 0) {
    is_loading = false;
    checkNavbarWidth();
  }

  function onClick() {
    isOpen = !isOpen;
  }

  function checkNavbarWidth() {
    if (image_width + list_width >= total_width) isMobileMenu = true;
    else {
      if (isOpen) {
        onClick();
        setTimeout(() => {
          isMobileMenu = false;
        }, MOBILE_FLY_TRANSITION);
      } else isMobileMenu = false;
    }
  }

  function setRedirect() {
    isRoot = document.location.pathname != '/';
  }
</script>

<header bind:offsetWidth={total_width}>
  <a id="title" href="/" bind:offsetWidth={image_width}>
    <img src="/img/icon/icon-navbar.webp" alt="icon" draggable="false" />
  </a>
  {#if isMobileMenu}
    <button id="nav_toggle" aria-label="Open mobile menu" on:click={() => onClick()}>
      <span class="nav_bar {isOpen ? 'nav_bar_open' : ''}" />
      <span class="nav_bar {isOpen ? 'nav_bar_open' : ''}" />
      <span class="nav_bar {isOpen ? 'nav_bar_open' : ''}" />
    </button>
    {#if isOpen}
      <ul id="nav_list_open" transition:fly={{ y: -150, duration: MOBILE_FLY_TRANSITION }}>
        <slot />
        {#if isRoot && addHomeLink}
          <li><a href="/">Home</a></li>
        {/if}
      </ul>
    {/if}
  {:else}
    <ul class={is_loading ? 'loading' : ''} id="nav_list" bind:offsetWidth={list_width}>
      <slot />
      {#if isRoot && addHomeLink}
        <li><a href="/">Home</a></li>
      {/if}
    </ul>
  {/if}
</header>

<style>
  header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: white;
    z-index: 99;
  }

  #title {
    margin: 5px;
    height: calc(100% - 10px);
  }

  #title > img {
    height: 100%;
    object-fit: contain;
  }

  #nav_list {
    list-style: none;
    color: #161616;
    padding-left: 5px;
  }

  .loading {
    color: transparent !important;
  }

  #nav_toggle {
    display: inline-block;
    cursor: pointer;
    margin: 0 15px;
    color: #161616;
    border: none;
    background-color: transparent;
    -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
  }

  .nav_bar {
    display: block;
    width: 30px;
    height: 3px;
    background-color: #161616;
    margin: 6px 0;
    border-radius: 25px;
    transition:
      transform 0.3s ease-out,
      opacity 0.3s ease-out;
  }

  .nav_bar_open:nth-child(1) {
    transform: translateX(-5px) rotate(-45deg) translateY(12.5px);
  }

  .nav_bar_open:nth-child(2) {
    opacity: 0;
  }

  .nav_bar_open:nth-child(3) {
    transform: translateX(-5px) rotate(45deg) translateY(-12.5px);
  }

  #nav_list_open {
    display: flex;
    position: fixed;
    top: 75px;
    background-color: #333;
    width: 100%;
    animation: none;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  :global(#nav_list > li) {
    float: left;
    margin: 0 clamp(10px, 1vw, 15px);
    transition: transform 0.3s ease;
  }

  :global(#nav_list > li > a) {
    text-decoration: none;
    color: #161616;
    font-size: 1.25rem;
    text-align: center;
    font-weight: normal;
    transition: color 0.3s ease;
    padding: 50% 0;
  }

  :global(#nav_list > li > a:hover) {
    color: var(--primary);
    text-shadow: none;
  }

  :global(#nav_list_open > li) {
    height: fit-content;
    margin: 12.5px 0;
  }

  :global(#nav_list_open > li:hover) {
    transform: none;
  }

  :global(#nav_list_open > li > a) {
    text-decoration: none;
    color: white;
    font-size: 1.25rem;
    transition: color 0.3s ease;
  }

  :global(#nav_list_open > li > a:hover) {
    color: var(--primary);
    text-shadow: none;
  }
</style>
