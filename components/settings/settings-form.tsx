'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

type Profile = {
  id: string
  name: string | null
  avatar_url: string | null
  email_class_reminders: boolean
  email_product_updates: boolean
} | null

export default function SettingsForm({ user, profile }: { user: User; profile: Profile }) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(profile?.name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [classReminders, setClassReminders] = useState(profile?.email_class_reminders ?? true)
  const [productUpdates, setProductUpdates] = useState(profile?.email_product_updates ?? true)
  const [savingPrefs, setSavingPrefs] = useState(false)

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      setProfileMessage('Error uploading avatar: ' + uploadError.message)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
    const newUrl = `${urlData.publicUrl}?t=${Date.now()}` // cache-bust

    setAvatarUrl(newUrl)

    await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', profile.id)
  }

  async function saveProfile() {
    if (!profile) return
    setSavingProfile(true)
    setProfileMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim() || null })
      .eq('id', profile.id)

    if (error) {
      setProfileMessage('Error saving: ' + error.message)
    } else {
      setProfileMessage('Profile updated!')
    }
    setSavingProfile(false)
  }

  async function changePassword() {
    setPasswordError(null)
    setPasswordMessage(null)

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setSavingPassword(true)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordMessage('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setSavingPassword(false)
  }

  async function savePreferences() {
    if (!profile) return
    setSavingPrefs(true)

    await supabase
      .from('profiles')
      .update({
        email_class_reminders: classReminders,
        email_product_updates: productUpdates,
      })
      .eq('id', profile.id)

    setSavingPrefs(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-medium">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
      </div>

      {/* Profile section */}
      <div className="border rounded-lg p-6 mb-6">
        <h2 className="font-medium mb-4">Profile</h2>

        <div className="flex items-center gap-4 mb-5">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-full bg-secondary overflow-hidden flex items-center justify-center cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-medium text-muted-foreground">
                {user.email?.[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm px-3 py-1.5 border rounded-md hover:bg-secondary transition-colors cursor-pointer"
            >
              Change avatar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-xs font-medium text-muted-foreground">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="text-sm px-3 py-2 border rounded-md bg-background"
          />
        </div>

        {profileMessage && <p className="text-sm text-muted-foreground mb-3">{profileMessage}</p>}

        <button
          onClick={saveProfile}
          disabled={savingProfile}
          className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50 cursor-pointer"
        >
          {savingProfile ? 'Saving...' : 'Save profile'}
        </button>
      </div>

      {/* Password section */}
      <div className="border rounded-lg p-6 mb-6">
        <h2 className="font-medium mb-4">Change password</h2>

        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="text-sm px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="text-sm px-3 py-2 border rounded-md bg-background"
            />
          </div>
        </div>

        {passwordError && <p className="text-sm text-red-500 mb-3">{passwordError}</p>}
        {passwordMessage && <p className="text-sm text-green-600 mb-3">{passwordMessage}</p>}

        <button
          onClick={changePassword}
          disabled={savingPassword}
          className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50 cursor-pointer"
        >
          {savingPassword ? 'Updating...' : 'Update password'}
        </button>
      </div>

      {/* Email preferences */}
      <div className="border rounded-lg p-6">
        <h2 className="font-medium mb-4">Email preferences</h2>

        <div className="flex flex-col gap-4 mb-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={classReminders}
              onChange={(e) => setClassReminders(e.target.checked)}
              className="mt-0.5 cursor-pointer"
            />
            <div>
              <div className="text-sm font-medium">Class reminders</div>
              <div className="text-xs text-muted-foreground">
                Get reminded about upcoming classes you've scheduled
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={productUpdates}
              onChange={(e) => setProductUpdates(e.target.checked)}
              className="mt-0.5 cursor-pointer"
            />
            <div>
              <div className="text-sm font-medium">Product updates</div>
              <div className="text-xs text-muted-foreground">
                Occasional emails about new features and improvements
              </div>
            </div>
          </label>
        </div>

        <button
          onClick={savePreferences}
          disabled={savingPrefs}
          className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50 cursor-pointer"
        >
          {savingPrefs ? 'Saving...' : 'Save preferences'}
        </button>
      </div>
    </div>
  )
}
