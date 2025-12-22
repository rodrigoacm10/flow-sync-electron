'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    console.log('RES ->', res)

    if (res.ok) {
      window.location.href = '/dashboard'
    } else {
      const err = await res.json()
      alert(err.error || 'Erro ao registrar')
    }
  }

  return (
    <div className="bg-gradient-to-br from-[#000000]/100 to-[#2b2b2b] min-h-screen flex items-center justify-center flex-col">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-2 w-64 text-white bg-red-300 items-center rounded-xl px-2 py-5"
      >
        <p className="font-bold text-xl">Cadastrar</p>

        <div className="flex flex-col gap-3 mt-2">
          <input
            className="w-full border-2 rounded-lg px-2 py-1"
            placeholder="Email"
            {...register('email')}
          />
          {errors.email && <p>{errors.email.message}</p>}

          <input
            className="w-full border-2 rounded-lg px-2 py-1"
            type="password"
            placeholder="Senha"
            {...register('password')}
          />
          {errors.password && <p>{errors.password.message}</p>}

          <input
            className="w-full border-2 rounded-lg px-2 py-1"
            type="password"
            placeholder="Confirmar senha"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}

          <button
            className="bg-red-500 mt-2 w-full rounded-lg p-2 hover:cursor-pointer"
            type="submit"
          >
            Criar conta
          </button>
        </div>
      </form>

      <button
        className="text-white mt-2 underline hover:cursor-pointer"
        onClick={() => {
          window.location.href = '/'
        }}
      >
        possuo conta
      </button>
    </div>
  )
}
