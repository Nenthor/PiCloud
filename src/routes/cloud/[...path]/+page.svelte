<script lang="ts">
  import DirectoryView from '$lib/components/DirectoryView.svelte';
  import FileView from '$lib/components/FileView.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Navbar from '$lib/components/Navbar.svelte';

  export let data;

  function getParentDirectory(path: string[]) {
    return path.slice(0, -1).join('/');
  }
</script>

<Navbar addHomeLink={false}>
  {#if data.path.length > 0 && data.path[0] !== ''}
    <li>
      <a href="/cloud/{getParentDirectory(data.path)}">Zurück</a>
    </li>
  {/if}
</Navbar>

<main>
  {#if data.fileType === 'directory'}
    <DirectoryView path={data.path} files={data.files} folders={data.folders} />
  {:else if data.fileType === 'file'}
    <FileView path={data.path} size={data.size} creationDate={data.creationDate} files={data.files} />
  {/if}
</main>

<Footer />

<style>
  main {
    overflow-y: hidden;
  }
</style>
