import type { ModalFixture } from './w3m-fixture'
import { Email } from '../utils/email'
import { ModalWalletPage } from '../pages/ModalWalletPage'
import { ModalWalletValidator } from '../validators/ModalWalletValidator'
import type { ModalPage } from '../pages/ModalPage'
import { timingFixture } from './timing-fixture'

// Test Modal + Smart Account
export const testModalSmartAccount = timingFixture.extend<
  ModalFixture & { slowModalPage: ModalPage }
>({
  library: ['wagmi', { option: true }],
  modalPage: [
    async ({ page, library, context }, use, testInfo) => {
      const modalPage = new ModalWalletPage(page, library)
      const modalValidator = new ModalWalletValidator(page)
      await modalPage.load()

      const mailsacApiKey = process.env['MAILSAC_API_KEY']
      if (!mailsacApiKey) {
        throw new Error('MAILSAC_API_KEY is not set')
      }
      const email = new Email(mailsacApiKey)
      const tempEmail = email.getEmailAddressToUse(testInfo.parallelIndex)

      await modalPage.emailFlow(tempEmail, context, mailsacApiKey)
      await modalPage.openAccount()
      await modalPage.openSettings()
      await modalPage.switchNetwork('Sepolia')
      await modalValidator.expectSwitchedNetwork('Sepolia')
      await modalPage.closeModal()
      await use(modalPage)
    },
    { timeout: 90_000 }
  ],
  modalValidator: async ({ modalPage }, use) => {
    const modalValidator = new ModalWalletValidator(modalPage.page)
    await use(modalValidator)
  }
})
