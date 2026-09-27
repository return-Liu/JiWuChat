<template>
  <div class="about-layout">
    <AboutSidebarLeft :current-section="currentSection" @switch-section="switchSection" />

    <main class="about-content" ref="aboutContentRef" @scroll="handleScroll">
      <div class="markdown-body">
        <AboutBanner />

        <FeaturesSection
          v-if="currentSection === 'features'"
          :should-show-section="shouldShowSection"
        />
        <TechstackSection
          v-if="currentSection === 'techstack'"
          :should-show-section="shouldShowSection"
        />
        <OverviewSection
          v-if="currentSection === 'overview'"
          :should-show-section="shouldShowSection"
        />
        <DesignSection
          v-if="currentSection === 'design'"
          :should-show-section="shouldShowSection"
        />
        <ContributeSection
          v-if="currentSection === 'contribute'"
          :should-show-section="shouldShowSection"
        />
        <TeamSection v-if="currentSection === 'team'" :should-show-section="shouldShowSection" />
      </div>
    </main>

    <AboutSidebarRight
      :current-section="currentSection"
      :active-anchor="activeAnchor"
      @scroll-to-anchor="scrollToAnchor"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import {
  useAboutNavigation,
  type Section,
  SECTION_FIRST_ANCHOR,
} from "../../composables/useAboutNavigation";
import AboutSidebarLeft from "./AboutSidebarLeft.vue";
import AboutSidebarRight from "./AboutSidebarRight.vue";
import AboutBanner from "./AboutBanner.vue";
import FeaturesSection from "../sections/FeaturesSection.vue";
import TechstackSection from "../sections/TechstackSection.vue";
import OverviewSection from "../sections/OverviewSection.vue";
import DesignSection from "../sections/DesignSection.vue";
import ContributeSection from "../sections/ContributeSection.vue";
import TeamSection from "../sections/TeamSection.vue";

const currentSection = ref<Section>("features");
const activeAnchor = ref<string>("");
const aboutContentRef = ref<HTMLElement | null>(null);

const {
  scrollToAnchor: scrollToAnchorFn,
  calcCurrentAnchor,
  handleScroll: handleScrollFn,
  shouldShowSection,
  isProgramScroll,
} = useAboutNavigation(aboutContentRef, currentSection, activeAnchor);

function switchSection(section: Section) {
  currentSection.value = section;
  nextTick(() => scrollToAnchorFn(SECTION_FIRST_ANCHOR[section]));
}

function scrollToAnchor(anchorId: string) {
  scrollToAnchorFn(anchorId);
}

function handleScroll() {
  handleScrollFn();
}

watch(currentSection, () => {
  nextTick(() => setTimeout(calcCurrentAnchor, 100));
});

onMounted(() => {
  nextTick(() => calcCurrentAnchor());
});

onBeforeUnmount(() => {
  aboutContentRef.value = null;
});
</script>

<style scoped>
.about-layout {
  display: flex;
  gap: 0;
  max-width: 1260px;
  margin: 0 auto;
}

.about-content {
  flex: 1;
  padding: 32px 48px;
  max-height: calc(100vh - 160px);
  overflow-y: auto;
}

.about-content::-webkit-scrollbar {
  width: 0;
}
.about-content {
  scrollbar-width: none;
}

.markdown-body {
  line-height: 1.8;
  color: var(--text-primary);
}

.markdown-body p {
  margin-bottom: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 20px;
  margin-bottom: 16px;
}

.markdown-body li {
  margin-bottom: 4px;
  color: var(--text-secondary);
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
}

.markdown-body strong {
  font-weight: 600;
  color: var(--text-primary);
  font-family: "Alimama", Helvetica, sans-serif;
}

.markdown-body code {
  background: var(--bg-hover, rgba(0, 0, 0, 0.04));
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: "Alimama", Helvetica, sans-serif;
}

@media (max-width: 900px) {
  .about-content {
    padding: 24px 20px;
  }
}
</style>
