<script lang="ts">
  let html_msg: HTMLParagraphElement;
  let timeout: any = null;
  let message = '';

  export function setErrorMessage(msg: string, success = false) {
    if (msg === '') return;
    if (timeout) clearTimeout(timeout);
    message = msg;
    if (success) html_msg.style.color = '#32cd32';
    else html_msg.style.color = '#cd3232';
    timeout = setTimeout(() => (message = ''), 5000);
  }
</script>

<p class="msg" bind:this={html_msg}>{message}</p>

<style>
  .msg {
    line-break: strict;
    text-align: center;
    color: #cd3232;
  }
</style>
