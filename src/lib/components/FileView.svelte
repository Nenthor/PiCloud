<script lang="ts">
  import { goto } from '$app/navigation';
  import ErrorMessage from '$lib/components/ErrorMessage.svelte';
  import { clipName, isAudio, isImage, isVideo } from '$lib/General.js';
  import { getFullPath, getParentPath, getPathStr } from '$lib/Path';

  export let path: string[];
  export let size: string;
  export let creationDate: string;
  export let files: string[];

  let filename = '';
  let newName = '';
  let setErrorMessage: (msg: string, success?: boolean) => void;

  $: filename = path[path.length - 1];

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

  function onNextFile(direction: 'left' | 'right') {
    const currentFileIndex = files.indexOf(filename);

    let nextFileIndex = currentFileIndex + (direction === 'left' ? -1 : 1);
    if (nextFileIndex < 0) nextFileIndex = files.length - 1;
    if (nextFileIndex >= files.length) nextFileIndex = 0;

    const newPath = [...getParentPath(path), files[nextFileIndex]];
    goto(getFullPath(newPath)!);
  }
</script>

<div class="container">
  {#if isVideo(filename) || isAudio(filename) || isImage(filename)}
    <div class="frame">
      {#if isVideo(filename) || isAudio(filename)}
        <video controls>
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
  .next {
    display: flex;
    width: 100%;
    height: 50px;
    gap: 5px;
  }

  .next > button {
    flex-grow: 1;
    padding: 5px;
    background-color: white;
    border-radius: 0;
    height: 100%;
    border-radius: 0 5px 0 15px;
  }

  .next > button:hover {
    background-color: var(--primary) !important;
  }

  .next > button:hover > img {
    filter: invert(1);
  }

  .next img {
    aspect-ratio: 1 / 1;
    height: 100%;
    object-fit: contain;
  }

  .next > button:last-child {
    transform: rotateY(180deg);
  }

  .next > button:hover {
    background-color: #f0f0f0;
  }

  .container {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 15px;
    width: calc(100% - 30px);
    height: max(300px, calc(100vh - 30px - 75px - 40px));
    gap: 15px;
  }

  .frame {
    flex-grow: 1;
    height: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stats {
    width: clamp(300px, 25%, 500px);
    min-width: min-content;
    height: max(min-content, 300px);
    min-height: min-content;
    max-height: 100%;
    background-color: #646464;
    border-radius: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .frame > * {
    aspect-ratio: 16 / 9;
    width: 100%;
    height: 100%;
    border-radius: 15px;
    background-color: black;
    box-shadow: 0 0 10px black;
    object-fit: contain;
  }

  .title {
    font-size: 1.5rem;
    text-align: center;
    margin: 40px 10px 0 10px;
    font-weight: 600;
    line-break: anywhere;
  }

  .infos {
    font-size: 1rem;
    text-align: center;
    margin: 5px 10px 10px 10px;
  }

  .settings {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
    gap: 30px;
    margin: 0 10px;
  }

  .rename {
    display: flex;
    flex-direction: row;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  .rename > input {
    flex-grow: 1;
    padding: 5px;
    border-radius: 10px;
    color: black;
    text-align: center;
    max-width: 200px;
  }

  .rename > button {
    padding: 7px 20px;
    color: var(--success-dark);
  }

  .rename > button:hover {
    background-color: var(--success-dark);
    color: white;
  }

  .delete {
    padding: 10px;
    width: calc(100% - 20px);
    max-width: 300px;
    color: white;
    background-color: var(--error);
  }

  .delete:hover {
    background-color: var(--error-dark);
  }

  .download {
    padding: 10px;
    width: calc(100% - 20px);
    max-width: 300px;
    color: white;
    color: var(--primary-dark);
  }

  .download:hover {
    background-color: var(--primary);
    color: white;
  }

  @media (max-width: 1600px) {
    .container {
      flex-direction: column;
      height: auto;
    }

    .frame {
      width: 100%;
      max-height: calc(100vh - 75px - 30px);
    }

    .stats {
      width: 100%;
    }

    .rename > input {
      max-width: calc(150px - 10px);
    }
  }
</style>
