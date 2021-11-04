import { createContext, ReactNode, useEffect, useState } from 'react'
import { api } from '../services/api'

type user = {
    id: string,
    name: string,
    login: string,
    avatar_url: string,
}

type AuthResponse = {
    token: string,
    user:{
        id: string,
        avatar_url : string,
        name : string,
        login : string,
    }
}

type AuthContextData = {
    user: user | null,
    signInUrl: string,
    signOut: () => void,
}
export const AuthContext = createContext({} as AuthContextData)

type AuthProvider = {
    children: ReactNode
}

export function AuthProvider(props : AuthProvider){

    const [user, setUser] = useState<user | null>(null)

    const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=a6f32a1d89bd23e03e00`

    async function singIn(gitHubCode : string){
        const response = await api.post<AuthResponse>('authenticate', {
            code: gitHubCode
        })
        
        const { token, user} = response.data

        api.defaults.headers.common.authorization = `Bearer ${token}`

        localStorage.setItem('@dowhile:token', token)

        setUser(user)
    }

    function signOut(){
        setUser(null)
        localStorage.removeItem('@dowhile:token')
    }

    useEffect(()=>{

        const token = localStorage.getItem('@dowhile:token')

        if (token){

            api.defaults.headers.common.authorization = `Bearer ${token}`

            api.get<user>('profile').then(res =>{
                setUser(res.data)
            })
        }


    }, [])

    useEffect(()=>{
        const url = window.location.href;
        const hasGithubCode = url.includes('?code=');

        if(hasGithubCode){
            const [urlWithoudCode, githubCode ] = url.split('?code=')

            console.log({urlWithoudCode,githubCode})

            window.history.pushState({}, '', urlWithoudCode)

            singIn(githubCode)
        }
    }, [])


    return (
        <AuthContext.Provider value={{signInUrl, user, signOut}}>
            {props.children}
        </AuthContext.Provider>
    )
}

