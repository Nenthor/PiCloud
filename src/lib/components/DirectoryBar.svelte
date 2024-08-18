<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { clipName } from '$lib/General';
  import { getPathStr } from '$lib/Path';

  export let path: string[];
  export let uploadFile: (file: File) => void;
  export let changeZoomLevel: (isIncrease: boolean) => void;
  export let onSelectingElements: (type: 'delete' | 'download') => void;

  async function addFolder() {
    let folderName = prompt('Gebe deinem Ordner einen Namen:');
    if (!folderName) return;

    const res = await fetch(`/api/file/${getPathStr([...path, folderName])}`, {
      method: 'POST',
      headers: {
        'X-Is-Folder': 'true'
      }
    });

    if (res.ok) {
      await invalidateAll();
    } else {
      alert('Fehler beim Erstellen des Ordners');
    }
  }

  async function uploadFiles() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.click();

    input.onchange = async () => {
      const files = input.files;
      if (!files) return;

      for (const file of files) {
        uploadFile(file);
      }
    };
  }

  async function downloadFolder() {
    const a = document.createElement('a');
    a.href = `/api/file/${getPathStr(path)}`;
    a.download = 'archive.zip';
    document.body.appendChild(a);
    a.click();
  }
</script>

<div class="container">
  <div class="path">
    <h1>{clipName('/' + getPathStr(path), 50, true)}</h1>
  </div>

  <div class="actions">
    <button on:click={addFolder}>
      <img src="/img/svg/add-folder.svg" alt="Add folder" draggable="false" title="Ordner hinzufügen" />
    </button>
    <button on:click={uploadFiles}>
      <img src="/img/svg/file-upload.svg" alt="Add files" draggable="false" title="Dateien hinzufügen" />
    </button>
    <button on:click={downloadFolder}>
      <img src="/img/svg/folder-zip.svg" alt="Download folder" draggable="false" title="Ordner herunterladen" />
    </button>
    <button on:click={() => onSelectingElements('download')}>
      <img src="/img/svg/file-download.svg" alt="multiple select download" draggable="false" title="Elemente herunterladen" />
    </button>
    <button on:click={() => onSelectingElements('delete')}>
      <img src="/img/svg/file-delete.svg" alt="multiple select delete" draggable="false" title="Elemente löschen" />
    </button>
    <button on:click={() => changeZoomLevel(true)}>
      <img src="/img/svg/zoom-plus.svg" alt="Increase zoom" draggable="false" title="Vergrößern" />
    </button>
    <button on:click={() => changeZoomLevel(false)}>
      <img src="/img/svg/zoom-minus.svg" alt="Decrease zoom" draggable="false" title="Verkleinern" />
    </button>
  </div>
</div>

<style>
  .container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 5px;
    width: calc(100% - 10px);
    border-radius: 10px 10px 0 0;
    background-color: #333;
    flex-wrap: wrap;
  }

  .container > div {
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    flex-grow: 1;
    flex-basis: 100%;
  }

  .actions {
    gap: 5px;
    flex-wrap: wrap;
    max-width: min(100%, 1000px);
  }

  .path > h1 {
    color: white;
    font-weight: 600;
    background-color: var(--primary-dark);
    border-radius: 5px;
    padding: 5px 15px;
    min-width: 50%;
    width: fit-content;
    max-width: calc(100% - 30px);
    text-align: center;
    overflow-wrap: anywhere;
  }

  .container button {
    background-color: transparent;
    margin: 0;
    padding: 0;
    border: none;
    cursor: pointer;
  }

  .container img {
    aspect-ratio: 1 / 1;
    width: 32px;
    margin: 0 10px;
    transition: transform ease-in-out 0.2s;
  }

  .container img:hover {
    transform: scale(1.15);
  }
</style>
