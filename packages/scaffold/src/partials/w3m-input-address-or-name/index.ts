import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import styles from './styles.js'
import { property, state } from 'lit/decorators.js'
import { SendController } from '@web3modal/core'
import { createRef, ref } from 'lit/directives/ref.js'
import type { Ref } from 'lit/directives/ref.js'

@customElement('w3m-input-address-or-name')
export class W3mInputAddressOrName extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  public inputElementRef: Ref<HTMLInputElement> = createRef()

  public instructionElementRef: Ref<HTMLElement> = createRef()

  // -- State & Properties -------------------------------- //
  @property() public receiverAddress?: string

  @state() private instructionHidden = Boolean(this.receiverAddress)

  protected override firstUpdated() {
    if (this.receiverAddress) {
      this.instructionHidden = true
    }
    this.checkHidden()
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html` <wui-flex
      @click=${this.onBoxClick.bind(this)}
      flexDirection="column"
      justifyContent="center"
      gap="xs"
      .padding=${['s', 's', 's', 's'] as const}
    >
      <wui-text
        ${ref(this.instructionElementRef)}
        class="instruction"
        color="fg-300"
        variant="medium-400"
        icon="search"
      >
        Type name or address
      </wui-text>
      <input
        type="text"
        ?disabled="${!this.instructionHidden}"
        @input="${this.onInputChange.bind(this)}"
        @blur="${this.onBlur.bind(this)}"
        .value="${this.receiverAddress ?? ''}"
        autocomplete="off"
        ${ref(this.inputElementRef)}
      />
    </wui-flex>`
  }

  // -- Private ------------------------------------------- //
  private async focusInput() {
    if (this.instructionElementRef.value) {
      this.instructionHidden = true
      await this.toggleInstructionFocus(false)
      this.instructionElementRef.value.style.pointerEvents = 'none'
      this.inputElementRef.value?.focus()
      if (this.inputElementRef.value) {
        // eslint-disable-next-line no-multi-assign
        this.inputElementRef.value.selectionStart = this.inputElementRef.value.selectionEnd =
          this.inputElementRef.value.value.length
      }
    }
  }

  private async focusInstruction() {
    if (this.instructionElementRef.value) {
      this.instructionHidden = false
      await this.toggleInstructionFocus(true)
      this.instructionElementRef.value.style.pointerEvents = 'auto'
      this.inputElementRef.value?.blur()
    }
  }

  private async toggleInstructionFocus(focus: boolean) {
    if (this.instructionElementRef.value) {
      await this.instructionElementRef.value.animate(
        [{ opacity: focus ? 0 : 1 }, { opacity: focus ? 1 : 0 }],
        {
          duration: 100,
          easing: 'ease',
          fill: 'forwards'
        }
      ).finished
    }
  }

  private onBoxClick() {
    if (!this.receiverAddress && !this.instructionHidden) {
      this.focusInput()
    }
  }

  private onBlur() {
    if (!this.receiverAddress && this.instructionHidden) {
      this.focusInstruction()
    }
  }

  private checkHidden() {
    if (this.instructionHidden) {
      this.focusInput()
    }
  }

  private onInputChange(e: InputEvent) {
    const element = e.target as HTMLInputElement

    if (element.value && !this.instructionHidden) {
      this.focusInput()
    }

    SendController.setReceiverAddress(element.value)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-input-address-or-name': W3mInputAddressOrName
  }
}
