'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      window.location.href = '/dashboard'
    } else {
      alert('Login falhou')
    }
  }

  return (
    <div className="bg-gradient-to-br from-[#000000]/100 to-[#2b2b2b] min-h-screen flex items-center justify-center flex-col">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-2 w-64 text-white bg-red-300 items-center rounded-xl px-2 py-5"
      >
        <p className="font-bold text-xl">Login</p>

        <div className="flex flex-col gap-3 mt-2">
          <input
            className="border-2 rounded-lg px-2 py-1 w-full"
            placeholder="Email"
            {...register('email')}
          />
          {errors.email && <p>{errors.email.message}</p>}

          <input
            className="border-2 rounded-lg px-2 py-1 w-full"
            type="password"
            placeholder="Senha"
            {...register('password')}
          />
          {errors.password && <p>{errors.password.message}</p>}

          <button
            className="bg-red-500 mt-2 w-full rounded-lg p-2 hover:cursor-pointer"
            type="submit"
          >
            Entrar
          </button>
        </div>
      </form>
      <button
        className="text-white mt-2 underline hover:cursor-pointer"
        onClick={() => {
          window.location.href = '/register'
        }}
      >
        cadastrar
      </button>
    </div>
  )
}
