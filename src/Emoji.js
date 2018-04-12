'use strict';

const chalk = require('chalk');
const Input = require('./Input');
const selectors = require('../config/selectors');

class Emoji  {

  /**
   * Fills and upload the emoji form.
   *
   * @param file
   *   The file object to upload.
   * @param page
   *   The current page instance.
   */
  static async upload(file, page) {
    const filename = file.name;
    Input.set(selectors.UPLOAD.NAME, filename, page);
    const element = await page.$(selectors.UPLOAD.IMAGE);
    await element.uploadFile(file.dir + '/' + file.base);
    await page.click(selectors.UPLOAD.SUBMIT);
    await page.waitForNavigation();

    const successfull = await page.$eval('.alert', el => el.classList.contains('alert_success'));
    const message = await page.$eval('.alert', el => el.innerText);
    if (successfull) {
      // @todo Only print first line of success message.
      console.log(chalk.green('success'), message);
    }
    else {
      console.error(chalk.red('error'), message);
    }
  }

}

module.exports = Emoji;
