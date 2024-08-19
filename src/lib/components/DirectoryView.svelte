<script lang="ts">
  import { navigating } from '$app/stores';
  import { isAudio, isImage, isPDF, isVideo, isZip } from '$lib/General.js';
  import { getPathStr } from '$lib/Path';
  import type { Size } from '$lib/Types';
  import { onMount } from 'svelte';
  import DirectoryBar from './DirectoryBar.svelte';
  import FolderContentItem from './FolderContentItem.svelte';
  import ImageLoader from './ImageLoader.svelte';

  export let path: string[];
  export let size: Size;
  export let folders: string[];
  export let files: string[];

  const BASE_WIDTH = 170,
    ZOOM_STEP = 30,
    MIN_WIDTH = BASE_WIDTH - ZOOM_STEP * 3,
    MAX_WIDTH = BASE_WIDTH + ZOOM_STEP * 3;

  let width = BASE_WIDTH;
  let nonReadyFiles: string[] = [];
  let contentDiv: HTMLDivElement;
  let checkMode: 'delete' | 'download' | 'none' = 'none';
  let pressingShift = false;
  let checkedItems: string[] = [];
  let checkModeShow = false;

  $: if ($navigating) onSelectingElements('none', true);

  onMount(() => {
    addEventListener('keydown', (event) => {
      if (event.key === 'Shift') pressingShift = true;
    });

    addEventListener('keyup', (event) => {
      if (event.key === 'Shift') pressingShift = false;
    });

    () => {
      removeEventListener('keydown', (event) => {
        if (event.key === 'Shift') pressingShift = true;
      });

      removeEventListener('keyup', (event) => {
        if (event.key === 'Shift') pressingShift = false;
      });
    };
  });

  function addFile(fileName: string, ready: boolean) {
    if (!files.includes(fileName)) {
      files.push(fileName);
      files.sort();
    }

    if (ready) {
      delete nonReadyFiles[nonReadyFiles.indexOf(fileName)];
    } else if (!nonReadyFiles.includes(fileName)) {
      nonReadyFiles.push(fileName);
    } else {
      // File failed to upload (2x not ready)
      delete nonReadyFiles[nonReadyFiles.indexOf(fileName)];
      files = files.filter((file) => file !== fileName);
    }

    files = files;
    nonReadyFiles = nonReadyFiles;
  }

  function changeZoomLevel(isIncrease: boolean) {
    width = isIncrease ? Math.min(MAX_WIDTH, width + ZOOM_STEP) : Math.max(MIN_WIDTH, width - ZOOM_STEP);
  }

  let dragCounter = 0;
  function onDragEnter() {
    dragCounter++;
    if (dragCounter !== 1) return;
    contentDiv.classList.add('dragging');
  }

  function onDragLeave() {
    dragCounter--;
    if (dragCounter !== 0) return;
    contentDiv.classList.remove('dragging');
  }

  function onDragDrop(event: DragEvent) {
    contentDiv.classList.remove('dragging');
    dragCounter = 0;

    const dt = event.dataTransfer;
    const files = dt?.files;
    if (!dt || !files || files.length == 0) return;

    for (const file of files) {
      uploadFile(file);
    }
  }

  async function uploadFile(file: File) {
    addFile(file.name, false);
    try {
      const res = await fetch(`/api/file/${getPathStr([...path, file.name])}`, {
        method: 'POST',
        headers: {
          'X-Overwrite': 'true'
        },
        body: file
      });
      if (res.ok) {
        addFile(file.name, true);
      } else {
        console.error('Error uploading file', file.name);
        addFile(file.name, false);
      }
    } catch (err) {
      console.error('Error uploading file', file.name, err);
      addFile(file.name, false);
    }
  }

  function onSelectingElements(type: typeof checkMode, force = false) {
    checkModeShow = checkMode !== type && type !== 'none';

    setTimeout(
      () => {
        checkMode = checkMode === type ? 'none' : type;
        checkedItems = [];
      },
      checkModeShow || force ? 0 : 300
    );
  }

  function handleCheck(name: string) {
    // check if shift is pressed
    let checks = [];

    if (pressingShift && checkedItems.length !== 0) {
      const lastChecked = checkedItems[checkedItems.length - 1];
      const allItems = folders.concat(files);
      let lastIndex = allItems.indexOf(lastChecked);
      let currentIndex = allItems.indexOf(name);
      if (lastIndex === -1 || currentIndex === -1) return;

      // Remove every current checked item
      checkedItems = [];

      if (lastIndex < currentIndex) {
        for (let i = lastIndex; i <= currentIndex; i++) {
          checks.push(allItems[i]);
        }
      } else {
        for (let i = lastIndex; i >= currentIndex; i--) {
          checks.push(allItems[i]);
        }
      }
    } else {
      checks.push(name);
    }

    for (const check of checks) {
      if (checkedItems.includes(check)) checkedItems.splice(checkedItems.indexOf(check), 1);
      else checkedItems.push(check);
    }
    checkedItems = checkedItems;
  }

  async function onSelectionClick() {
    if (checkMode === 'none' || checkedItems.length === 0) return;
    if (checkMode === 'delete') {
      if (!confirm(`Möchtest du ${checkedItems.length} Elemente wirklich löschen?`)) return;

      await Promise.all(
        checkedItems.map((item) =>
          fetch(`/api/file/${getPathStr([...path, item])}`, {
            method: 'DELETE'
          })
        )
      );

      files = files.filter((file) => !checkedItems.includes(file));
      folders = folders.filter((folder) => !checkedItems.includes(folder));
      onSelectingElements('none');
    } else if (checkMode === 'download') {
      if (checkedItems.length === 1) {
        const a = document.createElement('a');
        a.href = `/api/file/${getPathStr([...path, checkedItems[0]])}`;
        a.download = checkedItems[0];
        document.body.appendChild(a);
        a.click();
      } else {
        const selectedFiles = checkedItems.filter((item) => files.includes(item));
        const slectedFolders = checkedItems.filter((item) => folders.includes(item));

        const a = document.createElement('a');
        a.href = `/api/file/${getPathStr(path)}?files=${selectedFiles.join(',')}&folders=${slectedFolders.join(',')}`;
        a.download = 'archive.zip';
        document.body.appendChild(a);
        a.click();
      }
      onSelectingElements('none');
    }
  }
</script>

<div class="container">
  <DirectoryBar {path} {size} {uploadFile} {changeZoomLevel} {onSelectingElements} />
  <div class="content" role="presentation" bind:this={contentDiv} on:drop|preventDefault={onDragDrop} on:dragenter={onDragEnter} on:dragleave={onDragLeave} on:dragover|preventDefault={() => {}}>
    <button on:click={onSelectionClick} class="selectAction {checkModeShow ? 'selectActionShow' : ''} {checkMode}"
      >{checkedItems.length} Elemente {checkMode === 'download' ? 'herunterladen' : 'löschen'}</button
    >
    <ul>
      {#each folders as folder}
        <FolderContentItem {path} name={folder} {width} {checkMode} isChecked={checkedItems.includes(folder)} {handleCheck}>
          <ImageLoader src="/img/svg/folder.svg" alt="folder" disableLoading={true} />
        </FolderContentItem>
      {/each}
      {#each files as file}
        <FolderContentItem {path} name={file} {width} {checkMode} isChecked={checkedItems.includes(file)} {handleCheck}>
          {#if nonReadyFiles.includes(file)}
            <ImageLoader />
          {:else if isVideo(file)}
            <ImageLoader src="/api/file/{getPathStr([...path, file])}?thumbnail" alt="file" placeholderImage="/img/svg/file-video.svg" imageStyle="border-radius: 10px; object-fit: cover;">
              <img class="playButton" src="/img/svg/video-play.svg" alt="play" draggable="false" />
            </ImageLoader>
          {:else if isImage(file)}
            <ImageLoader src="/api/file/{getPathStr([...path, file])}?thumbnail" alt="file" placeholderImage="/img/svg/file-image.svg" imageStyle="border-radius: 10px; object-fit: cover;" />
          {:else if isAudio(file)}
            <ImageLoader src="/img/svg/file-audio.svg" alt="file" disableLoading={true} />
          {:else if isZip(file)}
            <ImageLoader src="/img/svg/file-zip.svg" alt="file" disableLoading={true} />
          {:else if isPDF(file)}
            <ImageLoader src="/img/svg/file-pdf.svg" alt="file" disableLoading={true} />
          {:else}
            <ImageLoader src="/img/svg/file.svg" alt="file" disableLoading={true} />
          {/if}
        </FolderContentItem>
      {/each}
    </ul>
  </div>
</div>

<style>
  .selectAction {
    position: absolute;
    bottom: 15px;
    left: 50%;
    width: min(100%, 300px);
    transform: translateX(-50%) translateY(calc(100% + 15px));
    height: 50px;
    background-color: var(--primary-dark);
    font-weight: 500;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50px;
    z-index: 10;
    transition: transform 0.3s ease-out;
  }

  .selectActionShow {
    transform: translateX(-50%) translateY(0) !important;
  }

  .delete {
    background-color: var(--error);
  }

  .download {
    background-color: var(--primary-dark);
  }

  .selectAction:hover {
    filter: brightness(0.9);
  }

  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: calc(100vh - 75px - 40px - 20px);
    width: calc(100% - 20px);
    gap: 5px;
    margin: 10px;
  }

  .content {
    background-color: #666;
    flex-grow: 1;
    padding: 6px;
    border: 4px dashed transparent;
    width: calc(100% - 20px);
    min-height: 175px;
    border-radius: 0 0 10px 10px;
    overflow-y: auto;
  }

  :global(.dragging) {
    border: 4px dashed var(--primary) !important;
  }

  .content > ul {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .playButton {
    aspect-ratio: 1 / 1;
    position: absolute;
    top: 50%;
    left: 50%;
    width: 30%;
    transform: translate(-50%, -50%);
    filter: drop-shadow(0 0 10px black);
  }
</style>
