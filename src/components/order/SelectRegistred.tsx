import * as React from 'react'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function SelectRegistred({
  type,
  setType,
  placeholder,
  onChange,
}: {
  type: string
  setType: (val: string) => void
  placeholder: string
  onChange?: () => void
}) {
  return (
    <Select
      onValueChange={(value) => {
        setType(value)
        onChange?.()
      }}
      value={type}
      defaultValue="registred"
    >
      <SelectTrigger className="w-[180px]">
        {/* placeholder="Selecionar tipo de cliente" */}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="registred">Registrado</SelectItem>
        <SelectItem value="notRegistred">Avulso</SelectItem>
      </SelectContent>
    </Select>
  )
}
