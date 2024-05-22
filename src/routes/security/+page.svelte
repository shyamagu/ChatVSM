<script>
    import { onMount } from 'svelte';

    let data;

    let data2;

    onMount(async () => {
        const response = await fetch('/.auth/me');
        data = await response.json();

        const response2 = await fetch('/api/user');
        data2 = await response2.json();

    });
</script>

<h1>Security</h1>

<h3>Client</h3>

{#if data}
    <pre>{JSON.stringify(data, null, 2)}</pre>
{:else}
    <p>Loading...</p>
{/if}

<hr/>

<h3>Server</h3>

{#if data2}
    <pre>{JSON.stringify(data2, null, 2)}</pre>
{:else}
    <p>Loading...</p>
{/if}

