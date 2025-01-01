import {readFileSync, writeFileSync} from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const file_path = path.resolve(__dirname, './output/ype.bundle.user.js')
const content = `// ==UserScript==
// @name            Your Personal Engineer
// @description     Makes your trading routine more comfortable.
// @author          https://steamcommunity.com/id/EurekaEffect/
// @version         1.4

// @updateURL       https://github.com/EurekaEffect/your-personal-engineer/raw/refs/heads/master/output/ype.bundle.user.js
// @downloadURL     https://github.com/EurekaEffect/your-personal-engineer/raw/refs/heads/master/output/ype.bundle.user.js

// @match           *://backpack.tf/*
// @match           *://steamcommunity.com/tradeoffer/new*
// @match           *://tradeit.gg/tf2/*

// @run-at          document-idle
// ==/UserScript==`;

(async function () {
    const bundle_content = readFileSync(file_path, 'utf8');
    const concatenated_content = content + '\n' + bundle_content;

    writeFileSync(file_path, concatenated_content, 'utf8');

    console.log('UserContent has been prepended to output/ype.bundle.user.js');
})()
