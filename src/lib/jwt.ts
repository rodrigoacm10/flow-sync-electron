import { JWTPayload, SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export async function signJwt(payload: JWTPayload) {
  try {
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(SECRET)
  } catch (err) {
    console.error('JWT SIGN ERROR', err)
    throw err
  }
}

export async function verifyJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (err) {
    console.error('JWT VERIFY ERROR', err)
    return null
  }
}
