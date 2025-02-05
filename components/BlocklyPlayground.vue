<template>
    <div class="relative flex grow">
        <div id="blocklyDiv" class="h-full w-full"></div>
        <div class="absolute bottom-0 right-0 p-6 space-x-4">
            <UButton v-show="currentInstruction !== null || running" @click="onStopPressed" size="lg" class="shadow-md" color="red" icon="i-heroicons-stop" />
            <UButton @click="onStepPressed" size="lg" class="shadow-md" color="blue" icon="i-heroicons-chevron-right" />

            <UButton v-show="running" @click="onPausePressed" size="lg" class="shadow-md" icon="i-heroicons-pause" />
            <UButton v-show="!running" @click="onPlayPressed" size="lg" class="shadow-md" icon="i-heroicons-play" />
        </div>
    </div>
    <UModal v-model="disconnectedPopup" @close="disconnectedPopup = false">
        <div class="p-6 space-y-4">
            <h2 class="text-2xl font-semibold"> {{ $t('blocks.disconnectedPopup.title') }} </h2>
            <p> {{ $t('blocks.disconnectedPopup.message') }} </p>
            <span class="w-full h-1 rounded-full bg-slate-600" />
            <div class="flex w-full justify-end mt-4">
                <UButton color="primary" size="lg" @click="disconnectedPopup = false">
                    {{ $t('blocks.disconnectedPopup.button') }}
                </UButton>
            </div>
        </div>
    </UModal>
</template>

<script lang="ts" setup>
import * as Blockly from 'blockly';
import libraryBlocks from 'blockly/blocks';
import { javascriptGenerator } from 'blockly/javascript';
import En from '~/assets/scripts/blockly/en';
import Fr from '~/assets/scripts/blockly/fr';
import { getCustomBlocks } from '~/assets/scripts/blockly/blocks';
import { createTheme } from '~/assets/scripts/blockly/theme';
import defaultToolbox from '~/assets/toolbox.json';
import { TnyRemote, DisconnectedError } from '~/assets/scripts/TnyRemote';

// get locale from nuxt
const { locale } = useI18n();

async function loadBlocklyScripts() {
    return new Promise((resolve, reject) => {
        const scripts = [
            'blockly_compressed.js',
            'blocks_compressed.js',
            'msg/en.js',
            'msg/fr.js'
        ];
        
        let loaded = 0;
        const loadNextScript = () => {
            if (loaded < scripts.length) {
                const script = scripts[loaded];
                const scriptElement = document.createElement('script');
                scriptElement.src = `./blockly/${script}`;
                scriptElement.onload = () => {
                    loaded++;
                    loadNextScript();
                };
                scriptElement.onerror = (error) => {
                    reject(error);
                };
                document.body.appendChild(scriptElement);
            } else {
                resolve(true);
            }
        };
        loadNextScript();
    });
}

function loadBlocklyBlocks(workspace: Blockly.Workspace, blocks: any) {
    Blockly.serialization.workspaces.load({blocks: {blocks: blocks, languageVersion: 0}}, workspace);
}

function saveBlocklyBlocks(workspace: Blockly.Workspace) {
    return Blockly.serialization.workspaces.save(workspace);
}

function spawnDefaultWorkspace(workspace: Blockly.Workspace) {
    // setup event
    Blockly.Blocks['event_setup'] = {
        init: function() {
            this.appendDummyInput().appendField(Blockly.Msg['TNY_SETUP_TITLE']);
            this.appendStatementInput("insts").setCheck(null);
            this.setTooltip("");
            this.setHelpUrl("");
            this.setMovable(true);
            this.setStyle("event_blocks");
            this.suppressPrefixSuffix = true;
        }
    };
    javascriptGenerator.forBlock['event_setup'] = function(block: Blockly.Block) {
        const insts = javascriptGenerator.statementToCode(block, 'insts');
        return `window.blockly_setup = async () => {\n${insts}}\n`;
    };

    // loop event
    Blockly.Blocks['event_loop'] = {
        init: function() {
            this.appendDummyInput().appendField(Blockly.Msg['TNY_LOOP_TITLE']);
            this.appendStatementInput("insts").setCheck(null);
            this.setTooltip("");
            this.setHelpUrl("");
            this.setMovable(true);
            this.setStyle("event_blocks");
            this.suppressPrefixSuffix = true;
        }
    };
    javascriptGenerator.forBlock['event_loop'] = function(block: Blockly.Block) {
        const insts = javascriptGenerator.statementToCode(block, 'insts');
        return `window.blockly_loop = async () => {\n${insts}}\n`;
    };

    loadBlocklyBlocks(workspace, [{
        type: 'event_setup',
        deletable: false,
        x: 60,
        y: 60
    }, {
        type: 'event_loop',
        deletable: false,
        x: 540,
        y: 60
    }]);
}

let compileCode: () => void;
async function initBlockly() {
    const locales = {
        en: En,
        fr: Fr
    };
    
    if (locale.value in locales) {
        Blockly.setLocale((locales as any)[locale.value]);
    } else {
        Blockly.setLocale(locales.en as any);
    }

    const toolbox = {
        kind: "categoryToolbox",
        contents: defaultToolbox.map((categ) => ({
            ...categ,
            name: Blockly.Msg[`TNY_CTG_${categ.id?.toUpperCase()}`]
        }))
    };

    getCustomBlocks().forEach((block: any) => {
        if (Blockly.Blocks[block.block.type]) {
            console.error("Le bloc "+block.type+" existe déjà");
            return;
        }

        Blockly.defineBlocksWithJsonArray([block.block]);
        javascriptGenerator.forBlock[block.block.type] = block.js;

        const categIndex = toolbox.contents.findIndex(categ => categ.id === block.category);
        if (categIndex < 0) {
            console.error("Impossible de trouver la catégorie "+block.category+" dans la toolbox")
            return;
        }
        const categ = toolbox.contents[categIndex] as any;
        categ.contents.push({
            kind: "block",
            type: block.block.type
        });
    });

    const workspace = Blockly.inject(
        'blocklyDiv',
        {
            toolbox: toolbox,
            theme: 'tny',
            renderer: 'zelos',
            grid: {
                spacing: 40,
                length: 4,
                colour: '#8888',
                snap: true
            },
            move: {
                scrollbars: true,
                drag: true,
                wheel: false
            },
            zoom: {
                controls: false,
                wheel: true,
                startScale: 0.8,
                pinch: false
            },
            trashcan: false,
            sounds: false
        }
    );

    // add setup() and loop() endpoints
    spawnDefaultWorkspace(workspace);

    // hide flyout scrollbar
    const div = document.getElementById('blocklyDiv');
    if (!div) {
        console.error('blocklyDiv not found');
        return;
    }
    div.querySelectorAll(".blocklyFlyoutScrollbar").forEach((e: any) => {
        e.style.display = "none";
    });

    // define run button
    compileCode = () => {
        javascriptGenerator.STATEMENT_PREFIX = 'if (onBlockStart(%1)) {\n';
        javascriptGenerator.STATEMENT_SUFFIX = '}\nif (!onBlockEnd(%1)) return;\n';
        javascriptGenerator.addReservedWords('onBlockStart');
        javascriptGenerator.addReservedWords('onBlockEnd');
        const code = javascriptGenerator.workspaceToCode(workspace);
        console.log(code);
        
        try { eval(code); }
        catch (e) { console.error('Error running code', e); }
    }
}


const currentInstruction = ref<string|null>(null);
const shouldOnlyStep = ref(false);
const running = ref(false);

// Called before block execution, returns true if we should execute the block (false to skip it)
function onBlockStart(id: string) {
    if (!running.value) return false; // Don't execute block if not running

    const workspace = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;
    workspace.highlightBlock(id);

    if (currentInstruction.value !== null) {
        // Execute next block if targeted (it's a resume call, we try to reach the current instruction from code start)
        if (currentInstruction.value === id) {
            // marking execution for next block
            currentInstruction.value = null;
        }
        return false;
    }
    // current instruction is null, it's a normal execution. Mark this block as current instruction, and proceed
    currentInstruction.value = id;
    return true;
}
if (import.meta.client) { (window as any).onBlockStart = onBlockStart; } // doing this to avoid function removal by minifier

// Called when block ended execution, returns true if we should continue (false to stop execution)
function onBlockEnd(id: string) {
    const workspace = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;
    workspace.highlightBlock(null);
    
    if (!running.value) return false; // Stop execution if not running

    if (currentInstruction.value !== null && currentInstruction.value !== id) {
        // Resume has been called, just continue to try to reach the current instruction
        return true;
    }

    if (shouldOnlyStep.value) {
        if (currentInstruction.value === null) {
            // Skipping to let next block execute
            return true;
        }
        
        // We only wanted to step, stop execution
        shouldOnlyStep.value = false;
        running.value = false;
        return false;
    }

    // We finished this block execution, reset current instruction and continue as normal
    currentInstruction.value = null;
    return true;
}
if (import.meta.client) { (window as any).onBlockEnd = onBlockEnd; } // doing this to avoid function removal by minifier

// Play pressed, start from the beginning
// or continue from the current instruction if it exists
async function onPlayPressed() {
    shouldOnlyStep.value = false;
    if (currentInstruction.value === null) {
        // first click on it, compile and start from the beginning
        compileCode();
    }
    runCode();
}

// Pause pressed, keep current instruction in memory
// and stop the execution
async function onPausePressed() {
    running.value = false;
}

// Stop pressed, reset the current instruction in memory
// and stop the execution
async function onStopPressed() {
    currentInstruction.value = null;
    running.value = false;
}

async function onStepPressed() {
    shouldOnlyStep.value = true;
    if (currentInstruction.value === null) {
        // first click on it, compile and start from the beginning
        compileCode();
    }
    runCode();
}

const disconnectedPopup = ref(false);
async function runCode() {
    const workspace = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;

    function handleCodeError(e: any) {
        if (e instanceof DisconnectedError) {
            disconnectedPopup.value = true;
        } else {
            alert('Erreur lors de l\'execution du code :\n' + e);
        }
        workspace.highlightBlock(null);
        onStopPressed();
    }

    running.value = true;
    try {
        await (window as any).blockly_setup?.();
    } catch (e) {
        handleCodeError(e);
        return;
    }

    function loop() {
        if (running.value) {
            try {
                (window as any).blockly_loop?.().then(() => {
                    setTimeout(loop, 10);
                });
            } catch (e) {
                handleCodeError(e);
            }
        }
    }
    loop();
}

if (import.meta.client) {
    // install scripts by adding them to the document
    loadBlocklyScripts().then((res) => {
        const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        createTheme(darkMode);
        initBlockly();
        TnyRemote.getInstance();
    }).catch((error) => {
        console.error('Error loading blockly scripts', error);
    });
}

</script>

<style></style>