import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import { Avatar, ConfirmDialog, Icon, IconButton, Loader, Modal, RoleBadge, Select } from '../components/ui'
import { useDeleteFamily, useFamilies, useInvitations, useMemberMutations, useMembers } from '../api/queries'
import { useCurrentFamily, useFamilySwitch } from '../family/FamilyContext'
import { notify } from '../components/toast'
import { money } from '../lib/format'
import type { Member, Role } from '../types'

const ROLES: { value: Role; label: string; desc: string; icon: string }[] = [
  { value: 'OWNER', label: 'Админ', desc: 'Управляет составом, ролями и настройками семьи', icon: 'crown' },
  { value: 'MEMBER', label: 'Участник', desc: 'Добавляет свои доходы и расходы, видит общие отчёты', icon: 'user' },
  { value: 'VIEWER', label: 'Просмотр', desc: 'Только смотрит отчёты, не меняет данные', icon: 'eye' },
]

export default function FamilyPage() {
  const { family, isLoading } = useCurrentFamily()
  const { data: members } = useMembers(family?.id)
  const { data: invitations } = useInvitations(family?.id)
  const m = useMemberMutations(family?.id ?? '')
  const [inviting, setInviting] = useState(false)
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [removing, setRemoving] = useState<Member | null>(null)
  const [deletingFamily, setDeletingFamily] = useState(false)
  const { data: families } = useFamilies()
  const { setFamilyId } = useFamilySwitch()
  const del = useDeleteFamily()

  if (isLoading || !family) return <Loader />
  const isOwner = family.myRole === 'OWNER'

  return (
    <>
      <PageHeader title="Семья"
        subtitle={`${family.name} · ${family.membersCount} участника · баланс ${money(family.balance)}`}
        actions={isOwner && <button className="btn btn-primary" onClick={() => setInviting(true)}><Icon name="user-plus" size={16} /> Пригласить</button>} />

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ padding: '6px 18px' }}>
          {members?.map((mem, i) => (
            <div key={mem.id} className="row" style={{ gap: 12, padding: '11px 0', borderBottom: i < (members.length - 1) ? '0.5px solid var(--border)' : 'none' }}>
              <Avatar name={mem.name} color={mem.color} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{mem.name} {mem.role === 'OWNER' && <span className="hint" style={{ fontSize: 12, fontWeight: 400 }}>· вы</span>}</div>
                <div className="hint" style={{ fontSize: 12 }}>{mem.email}</div>
              </div>
              <RoleBadge role={mem.role} />
              {isOwner && mem.role !== 'OWNER' && (
                <IconButton icon="dots" label="Управление участником" onClick={() => setEditMember(mem)} />
              )}
            </div>
          ))}
        </div>

        {!!invitations?.length && (
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Приглашения</div>
            {invitations.map((inv) => (
              <div key={inv.id} className="row" style={{ gap: 11, padding: '8px 0' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                  <Icon name="clock" size={17} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{inv.email}</div>
                  <div className="hint" style={{ fontSize: 12 }}>приглашение отправлено · ожидает подтверждения</div>
                </div>
                <RoleBadge role={inv.role} />
                {isOwner && <button className="btn btn-sm" onClick={() => m.cancelInvite.mutate(inv.id)}>Отменить</button>}
              </div>
            ))}
          </div>
        )}

        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
          <div className="muted" style={{ fontSize: 12, fontWeight: 500, marginBottom: 10 }}>Что могут роли</div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
            {ROLES.map((r) => (
              <div key={r.value} className="card" style={{ padding: '11px 12px' }}>
                <div className="row" style={{ gap: 7, fontSize: 12, fontWeight: 500, marginBottom: 5 }}><Icon name={r.icon} size={16} color="var(--text-secondary)" />{r.label}</div>
                <div className="hint" style={{ fontSize: 12, lineHeight: 1.5 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {isOwner && (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', borderColor: 'var(--danger)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Удалить семью</div>
              <div className="hint" style={{ fontSize: 12 }}>Безвозвратно удалит семью со всеми операциями, категориями и лимитами.</div>
            </div>
            <button className="btn btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setDeletingFamily(true)}>
              <Icon name="trash" size={15} /> Удалить
            </button>
          </div>
        )}
      </div>

      {inviting && <InviteModal onClose={() => setInviting(false)} onInvite={(email, role) => { m.invite.mutate({ email, role }); setInviting(false) }} />}
      {editMember && (
        <EditMemberModal member={editMember} onClose={() => setEditMember(null)}
          onRole={(role) => { m.changeRole.mutate({ memberId: editMember.id, role }); setEditMember(null) }}
          onRemove={() => { setRemoving(editMember); setEditMember(null) }} />
      )}
      {removing && (
        <ConfirmDialog title="Удалить участника?"
          message={`${removing.name} потеряет доступ к семье. Операции участника останутся в истории.`}
          confirmLabel="Удалить из семьи"
          onConfirm={() => m.removeMember.mutate(removing.id)} onClose={() => setRemoving(null)} />
      )}
      {deletingFamily && (
        <ConfirmDialog title="Удалить семью?"
          message={`«${family.name}» и все её данные — операции, категории, лимиты, участники — будут удалены безвозвратно.`}
          confirmLabel="Удалить семью"
          onConfirm={() => del.mutate(family.id, {
            onSuccess: () => {
              const next = families?.find((f) => f.id !== family.id)
              if (next) setFamilyId(next.id)
              notify(`Семья «${family.name}» удалена`, 'success')
            },
          })}
          onClose={() => setDeletingFamily(false)} />
      )}
    </>
  )
}

function InviteModal({ onClose, onInvite }: { onClose: () => void; onInvite: (email: string, role: Role) => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('MEMBER')
  return (
    <Modal title="Пригласить участника" onClose={onClose}
      footer={<button className="btn btn-primary" style={{ width: '100%' }} disabled={!email} onClick={() => onInvite(email, role)}>Отправить приглашение</button>}>
      <label style={lab}>Email</label>
      <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@family.ru" style={{ marginBottom: 14 }} />
      <label style={lab}>Роль</label>
      <Select value={role} onChange={(v) => setRole(v as Role)} options={ROLES}
        ariaLabel="Роль" style={{ display: 'block', width: '100%' }} />
    </Modal>
  )
}

function EditMemberModal({ member, onClose, onRole, onRemove }: {
  member: Member; onClose: () => void; onRole: (role: Role) => void; onRemove: () => void
}) {
  const [role, setRole] = useState<Role>(member.role)
  return (
    <Modal title={`Участник: ${member.name}`} onClose={onClose}
      footer={
        <div className="row" style={{ gap: 10 }}>
          <button className="btn" style={{ flex: 1, color: 'var(--danger)' }} onClick={onRemove}><Icon name="trash" size={15} /> Удалить</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => onRole(role)}>Сохранить роль</button>
        </div>
      }>
      <label style={lab}>Роль</label>
      <Select value={role} onChange={(v) => setRole(v as Role)}
        options={ROLES.map((r) => ({ value: r.value, label: `${r.label} — ${r.desc}` }))}
        ariaLabel="Роль" style={{ display: 'block', width: '100%' }} />
    </Modal>
  )
}

const lab: React.CSSProperties = { fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }
