import { Icon } from './ui'
import { notify } from './toast'
import { useInvitationActions, useMyInvitations } from '../api/queries'
import { useFamilySwitch } from '../family/FamilyContext'
import type { Role } from '../types'

const ROLE_LABEL: Record<Role, string> = { OWNER: 'админ', MEMBER: 'участник', VIEWER: 'просмотр' }

export default function InvitationsBanner() {
  const { data } = useMyInvitations()
  const { accept, decline } = useInvitationActions()
  const { setFamilyId } = useFamilySwitch()
  const invites = data ?? []
  if (!invites.length) return null

  const busy = accept.isPending || decline.isPending

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {invites.map((inv) => (
        <div key={inv.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--info-bg)', borderColor: 'var(--border-strong)', flexWrap: 'wrap' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--info)', flexShrink: 0 }}>
            <Icon name="mail-opened" size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--info)' }}>Приглашение в «{inv.familyName}»</div>
            <div style={{ fontSize: 12, color: 'var(--info)', opacity: 0.85 }}>{inv.invitedBy} приглашает вас как «{ROLE_LABEL[inv.role]}»</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-sm" disabled={busy} onClick={() => decline.mutate(inv.id)}>Отклонить</button>
            <button className="btn btn-primary btn-sm" disabled={busy}
              onClick={async () => {
                const fam = await accept.mutateAsync(inv.id)
                setFamilyId(fam.id)
                notify(`Вы присоединились к «${fam.name}»`, 'success')
              }}>
              Принять
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
