<script lang="ts">
  import { onMount } from 'svelte';

  export let src: string | undefined = undefined;
  export let alt = 'image';
  export let imageStyle = '';
  export let placeholderStyle = '';
  export let placeholderImage = '';
  export let disableLoading = false;

  let loaded = false;

  onMount(() => {
    if (src && !disableLoading) {
      let img = new Image();
      img.onload = () => (loaded = true);
      img.onerror = (err) => console.error(err);
      img.src = src;
    }
  });
</script>

{#if loaded || disableLoading}
  <slot />
  <img {src} {alt} style={imageStyle} draggable="false" />
{:else if placeholderImage}
  <img src={placeholderImage} {alt} style={placeholderStyle} draggable="false" />
{:else}
  <div class="loading" />
{/if}

<style>
  img {
    width: 100%;
    height: 100%;
  }

  .loading {
    width: 100%;
    height: 100%;

    background: linear-gradient(to right, #888 0%, #999 15%, #888 30%);
    background-size: 200% 100%;
    animation: skeleton-loading 2s infinite linear;
    border-radius: 10px;
  }

  @keyframes skeleton-loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: 0 0;
    }
  }
</style>
