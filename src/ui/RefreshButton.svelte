<script lang="ts">
  let isLoading = false;
  let buttonText = 'Refresh';
  async function onClick() {
    isLoading = true;
    try {
    } finally {
      isLoading = false;
    }
  }
</script>

<button class="amazing-marvin-refresh-button" disabled={isLoading}>{buttonText}</button>
