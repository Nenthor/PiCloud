<script lang="ts">
	import { onMount } from 'svelte';

	export let value: number;
	export let duration = 150;
	export let startValue = 0;
	export let roundPosition = 0;

	let currentValue = startValue;
	let endValue = value;

	$: if (value !== endValue) {
		endValue = value;
		currentValue = value;
	}

	onMount(() => {
		updateValue();
	});

	function updateValue() {
		const step = (value - startValue) / duration;
		currentValue = currentValue + step;
		if ((currentValue >= startValue && currentValue >= value) || (currentValue <= startValue && currentValue <= value)) {
			currentValue = value;
		} else {
			setTimeout(updateValue, 1);
		}
	}
</script>

{currentValue.toFixed(roundPosition)}
