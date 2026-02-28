import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'saved_addresses'
const MAX_SAVED = 30

function getSavedAddresses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveAddress(address) {
  if (!address?.trim()) return
  const addresses = getSavedAddresses()
  const filtered = addresses.filter(a => a.toLowerCase() !== address.toLowerCase())
  const updated = [address.trim(), ...filtered].slice(0, MAX_SAVED)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export default function AddressInput({ value, onChange, placeholder, className }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const wrapperRef = useRef(null)

  // Filter suggestions based on input
  useEffect(() => {
    if (!focused) return
    const saved = getSavedAddresses()
    if (!value?.trim()) {
      setSuggestions(saved.slice(0, 8))
    } else {
      const filtered = saved.filter(a =>
        a.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8)
      setSuggestions(filtered)
    }
  }, [value, focused])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (addr) => {
    onChange({ target: { value: addr } })
    setOpen(false)
    setFocused(false)
  }

  const handleBlur = () => {
    // Save on blur if value exists
    if (value?.trim()) saveAddress(value)
  }

  const showDropdown = open && focused && suggestions.length > 0

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={onChange}
        onFocus={() => { setFocused(true); setOpen(true) }}
        onBlur={handleBlur}
        placeholder={placeholder || "Toshkent sh., Yunusobod t., Amir Temur ko'chasi 123"}
        className={className}
        autoComplete="off"
      />
      {showDropdown && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {suggestions.map((addr, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(addr)}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors text-sm text-gray-800 dark:text-gray-200"
            >
              <span className="material-symbols-outlined text-base text-gray-400 flex-shrink-0">location_on</span>
              <span className="truncate">{addr}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
