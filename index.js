#!/usr/bin/env node
'use strict';

const puppeteer = require('puppeteer');
const inquirer = require('inquirer');
const path = require('path');
const Glob = require('glob').Glob;
const emoji = require('node-emoji');
const minimist = require('minimist');

const selectors = require('./config/selectors');
const Cookies = require('./src/Cookies');
const Emoji = require('./src/Emoji');
const Input = require('./src/Input');

(async () => {

  const argv = minimist(process.argv.slice(2));
  // @todo Check if cookies are valid before skipping the CLI prompt.
  const cookies = await Cookies.get();
  let teamname = '';
  let credentials;
  if (!cookies) {
    credentials = await inquirer.prompt([
      {
        name: 'email',
        message: 'E-Mail'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password'
      },
    ]).then(answers => answers);
    [, teamname] = credentials.email.match(/@(.+)\./);
  }
  const browser = await puppeteer.launch({
    headless: !argv.debug,
  });
  const page = await browser.newPage();
  const filepath = argv._[0] || process.cwd();
  const files = new Glob(`${filepath}/*.*(gif|png|jpg)`, {sync: true}).found;

  if (cookies) {
    // Set cookies on browser load to avoid logging in over again.
    await Cookies.restore(page);
    teamname = cookies.teamname;
  }

  await page.goto(`https://${teamname}.slack.com/customize/emoji`);

  // Check if we need to sign in.
  if (await page.$(selectors.LOGIN.EMAIL)) {
    await Input.set(selectors.LOGIN.EMAIL, credentials.email, page);
    await Input.set(selectors.LOGIN.PASSWORD, credentials.password, page);
    await page.click(selectors.LOGIN.SUBMIT);
    await page.waitForNavigation();
  }
  // Save new cookies after login
  // @todo Check if login was actually successfull.
  Cookies.save(await page.cookies(), teamname);

  for (let i = 0; i < files.length; i++) {
    const file = path.parse(files[i]);
    console.log(emoji.emojify(':gear:'), ' Processing ' + file.base);
    await Emoji.upload(file, page);
  }
  console.log(emoji.emojify(':sparkles:'), 'Done');
  await browser.close();

})();
