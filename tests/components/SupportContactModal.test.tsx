/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { I18nProvider } from '@/contexts/I18nContext'

// Import will be implemented in code step
import SupportContactModal from '@/components/common/SupportContactModal'

const dictEn = {
  common: {
    support: {
      modalTitle: 'Contact Support',
      modalSubtitle: 'Scan to join our Discord support channel',
      qrAlt: 'Discord support QR',
    },
  },
}

describe('SupportContactModal', () => {
  test('does not render when closed', () => {
    render(
      <I18nProvider locale="en" dict={dictEn as any}>
        <SupportContactModal isOpen={false} onClose={() => {}} imageSrc="/support/WechatIMG853.jpg" />
      </I18nProvider>
    )
    expect(screen.queryByTestId('support-modal')).toBeNull()
  })

  test('renders title and QR image when open', () => {
    render(
      <I18nProvider locale="en" dict={dictEn as any}>
        <SupportContactModal isOpen={true} onClose={() => {}} imageSrc="/support/WechatIMG853.jpg" />
      </I18nProvider>
    )
    expect(screen.getByText('Contact Support')).toBeInTheDocument()
    expect(screen.getByAltText('Discord support QR')).toBeInTheDocument()
  })
})

