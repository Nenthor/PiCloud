<script lang="ts">
  import { goto } from '$app/navigation';
  import ErrorMessage from '$lib/components/ErrorMessage.svelte';
  import { clipName, isAudio, isImage, isVideo } from '$lib/General.js';
  import { getFullPath, getParentPath, getPathStr } from '$lib/Path';
  import { onMount } from 'svelte';

  export let path: string[];
  export let size: string;
  export let creationDate: string;
  export let files: string[];

  const IMAGE_TIMEOUT = 5000; // 5 seconds

  let filename = '';
  let newName = '';
  let setErrorMessage: (msg: string, success?: boolean) => void;
  let isAutoplay: boolean;
  let videoHtml: HTMLVideoElement;
  let imageAutoplayInterval: NodeJS.Timeout | null;

  $: filename = path[path.length - 1];

  onMount(() => {
    return () => {
      if (imageAutoplayInterval) clearInterval(imageAutoplayInterval);
    };
  });

  async function onDelete() {
    const confirmDelete = confirm('Möchtest du die Datei wirklich löschen?');
    if (!confirmDelete) return;

    const res = await fetch(`/api/file/${getPathStr(path)}`, { method: 'DELETE' });

    if (res.ok) {
      goto(getFullPath(getParentPath(path))!);
    } else {
      setErrorMessage(await res.text());
    }
  }

  async function onRename() {
    if (!newName) {
      setErrorMessage('Bitte gib einen neuen Namen ein.');
      return;
    }

    let newPath = getPathStr([...getParentPath(path), newName])!;

    const res = await fetch(`/api/file/${getPathStr(path)}`, {
      method: 'PUT',
      headers: {
        'X-New-Path': newPath
      }
    });

    if (res.ok) {
      const newPath = await res.text();
      path = newPath.split('/');
      newName = '';
      goto(getFullPath(path)!);
    } else {
      setErrorMessage(await res.text());
    }
  }

  async function onDownload() {
    const a = document.createElement('a');
    a.href = `/api/file/${getPathStr(path)}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
  }

  function onNextFile(direction: 'left' | 'right', triggerdByAutoplay = false) {
    const currentFileIndex = files.indexOf(filename);

    let nextFileIndex = currentFileIndex + (direction === 'left' ? -1 : 1);
    if (nextFileIndex < 0) nextFileIndex = files.length - 1;
    if (nextFileIndex >= files.length) nextFileIndex = 0;

    const newPath = [...getParentPath(path), files[nextFileIndex]];
    goto(getFullPath(newPath)!);

    // Reload video with new source
    if (videoHtml) {
      videoHtml.src = `/api/file/${getPathStr(newPath)}`;
      videoHtml.load();
      videoHtml.play();
    }

    // Reset autoplay interval
    if (!triggerdByAutoplay) {
      isAutoplay = false;
      onAutoplayChange();
    }
  }

  function onEnded() {
    if (isAutoplay) onNextFile('right');
  }

  function onAutoplayChange() {
    if (!isImage(filename)) return;

    if (isAutoplay) {
      imageAutoplayInterval = setInterval(() => {
        onNextFile('right', true);
      }, IMAGE_TIMEOUT);
    } else if (imageAutoplayInterval) {
      clearInterval(imageAutoplayInterval);
    }
  }
</script>

<div class="container {isAudio(filename) ? 'audioContainer' : ''}">
  {#if isVideo(filename) || isAudio(filename) || isImage(filename)}
    <div class="frame">
      {#if isVideo(filename) || isAudio(filename)}
        <video bind:this={videoHtml} on:ended={onEnded} class={isAudio(filename) ? 'audioVideo' : ''} controls autoplay>
          <source src="/api/file/{getPathStr(path)}" />
          <track kind="captions" src="/api/file/{getPathStr(path)}" />
          Dein Browser unterstützt dieses Videoformat nicht.
        </video>
      {:else if isImage(filename)}
        <img src="/api/file/{getPathStr(path)}" alt={filename} />
      {/if}
    </div>
  {/if}

  <div class="stats">
    <p class="title">{clipName(filename, 100)}</p>
    <p class="infos">{size} - {creationDate}</p>
    <div class="settings">
      {#if isAudio(filename) || isVideo(filename) || isImage(filename)}
        <div class="autoplay">
          <input bind:checked={isAutoplay} on:change={onAutoplayChange} type="checkbox" id="autoplay" />
          <label for="autoplay">Autoplay</label>
        </div>
      {/if}
      <div class="rename">
        <input type="text" placeholder="Neuer Name" bind:value={newName} />
        <button on:click={onRename}>Umbenennen</button>
      </div>
      <button class="download" on:click={onDownload}>Herunterladen</button>
      <button class="delete" on:click={onDelete}>Löschen</button>
      <ErrorMessage bind:setErrorMessage />
    </div>
    <div class="next">
      <button on:click={() => onNextFile('left')}>
        <img src="/img/svg/file-arrow.svg" alt="Next Left" />
      </button>
      <button on:click={() => onNextFile('right')}>
        <img src="/img/svg/file-arrow.svg" alt="Next Right" />
      </button>
    </div>
  </div>
</div>

<style>
  .autoplay {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 15px;
  }

  .autoplay input {
    cursor: pointer;
    width: 20px;
    height: 20px;
  }

  .autoplay label {
    cursor: pointer;
    font-size: 1.1rem;
  }

  .container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    flex-basis: 0;
    align-items: center;
    justify-content: center;
    height: calc(100vh - 75px - 40px - 30px);
    min-height: 450px;
    gap: 15px;
    margin: 15px;
  }

  .audioContainer {
    flex-direction: column;
    flex-wrap: nowrap;
    height: auto;
    min-height: auto;
  }

  .audioContainer .frame {
    width: 100%;
    height: calc(30vh - 75px - 20px);
    flex: auto;
    min-height: auto;
    max-width: 750px;
  }

  .audioContainer .stats {
    width: calc(100% - 20px);
    max-width: 500px;
  }

  .frame {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 5;
    height: inherit;
    min-height: inherit;
    border-radius: 15px;
  }

  .frame video,
  .frame img {
    aspect-ratio: attr(width) / attr(height);
    width: 100%;
    border-radius: 15px;
    object-fit: contain;
  }

  video.audioVideo {
    aspect-ratio: none;
    height: 50px;
  }

  .stats {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 2;
    max-width: 400px;
    min-width: 200px;
    padding: 10px;
    border-radius: 15px;
    background-color: #646464;
  }

  @media (max-width: 800px) {
    .container {
      flex-direction: column;
      flex-wrap: nowrap;
      height: auto;
      min-height: auto;
    }

    .frame {
      width: 100%;
      height: calc(80vh - 75px - 20px);
      flex: auto;
      min-height: auto;
    }

    .frame video,
    .frame img {
      max-width: 100%;
      max-height: 100%;
    }

    .stats {
      width: calc(100% - 20px);
      max-width: none;
    }
  }

  .title {
    font-size: 1.5rem;
    font-weight: bold;
    text-align: center;
    overflow-wrap: anywhere;
  }

  .infos {
    text-align: center;
  }

  .settings {
    display: flex;
    align-items: center;
    flex-direction: column;
    padding: 1rem;
    background-color: #888;
    border-radius: 15px;
  }

  .rename {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    width: 70%;
    min-width: 200px;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .rename input {
    width: 100%;
    height: 1rem;
    padding: 0.5rem;
    border-radius: 15px;
    color: black;
    text-align: center;
    border: 5px solid transparent;
  }

  .rename input:focus {
    border: 5px solid var(--primary);
  }

  .rename button {
    background-color: white;
    color: var(--primary-dark);
    width: 100%;
    cursor: pointer;
  }

  .rename button:hover {
    background-color: var(--primary);
    color: white;
  }

  .delete {
    background-color: var(--error);
    color: white;
    width: 100%;
    min-width: 200px;
    cursor: pointer;
  }

  .delete:hover {
    background-color: var(--error-dark);
  }

  .download {
    color: var(--primary-dark);
    background-color: white;
    width: 100%;
    min-width: 200px;
    cursor: pointer;
    margin-bottom: 1.5rem;
  }

  .download:hover {
    background-color: var(--primary);
    color: white;
  }

  .next {
    display: flex;
    justify-content: center;
    gap: 5px;
    width: 100%;
    min-width: 200px;
    height: 50px;
  }

  .next button {
    flex-grow: 1;
    background-color: white;
    border-radius: 15px;
  }

  .next button:hover {
    background-color: var(--primary);
  }

  .next button:hover img {
    filter: invert(1);
  }

  .next img {
    height: 100%;
    object-fit: contain;
  }

  .next button:last-child > img {
    transform: rotateY(180deg);
  }
</style>
