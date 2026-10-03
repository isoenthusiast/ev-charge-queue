import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
export default class CreateUser extends BaseCommand {
  static commandName = 'user:create'
  static description =
    'Create a private account using interactive prompts or BOOTSTRAP_EMAIL / BOOTSTRAP_PASSWORD'
  static options: CommandOptions = { startApp: true }
  async run() {
    const { default: User } = await import('#models/user')
    const email = (process.env.BOOTSTRAP_EMAIL || (await this.prompt.ask('Email')) || '')
      .trim()
      .toLowerCase()
    const password =
      process.env.BOOTSTRAP_PASSWORD ||
      (await this.prompt.secure('Password (minimum 12 characters)')) ||
      ''
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      password.length < 12 ||
      password.length > 128
    ) {
      this.exitCode = 1
      this.logger.error('Valid email and a 12–128 character password required.')
      return
    }
    if (await User.findBy('email', email)) {
      this.exitCode = 1
      this.logger.error('Account already exists; no change made.')
      return
    }
    await User.create({ email, password })
    this.logger.success('Account created')
  }
}
