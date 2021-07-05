<script lang="ts">
  export let title: string;
  export let description: string;
  export let cta: string;
  export let handleCancel: () => void;
  export let handleCreate: (e: any) => Promise<void>;
</script>

<h2>{title}</h2>
<p>{description}</p>
<div class="modal-button-container">
  <button on:click={handleCancel}>Cancel</button>
  <button on:click={handleCreate}>{cta}</button>
</div>
