<template>
    <div>
      <div v-for="group in scriptCategories">
        <group-scripts :title="group.Title" :category="group.Category"></group-scripts>
      </div>
    </div>
</template>

<script>
export default {
  props: ['category'],
  data () {
    return { scriptCategories: scriptCategories }
  }
})
</script>