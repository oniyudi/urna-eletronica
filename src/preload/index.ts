import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  listarEleicoes: () => ipcRenderer.invoke('urna:listarEleicoes'),
  buscarEleicaoEmAndamento: () => ipcRenderer.invoke('urna:buscarEleicaoEmAndamento'),
  criarEleicao: (titulo: string, tamanhoDigitos: number, digitosPermitidos: string) =>
    ipcRenderer.invoke('urna:criarEleicao', titulo, tamanhoDigitos, digitosPermitidos),
  alterarStatusEleicao: (
    eleicaoId: number,
    novoStatus: 'RASCUNHO' | 'EM_ANDAMENTO' | 'ENCERRADA'
  ) => ipcRenderer.invoke('urna:alterarStatusEleicao', eleicaoId, novoStatus),
  listarCandidatos: (eleicaoId: number) => ipcRenderer.invoke('urna:listarCandidatos', eleicaoId),
  cadastrarCandidato: (eleicaoId: number, nome: string, numero: string) =>
    ipcRenderer.invoke('urna:cadastrarCandidato', eleicaoId, nome, numero),
  removerCandidato: (candidatoId: number) =>
    ipcRenderer.invoke('urna:removerCandidato', candidatoId),
  registrarVoto: (
    eleicaoId: number,
    tipo: 'VALIDO' | 'BRANCO' | 'NULO',
    numeroDigitado: string | null
  ) => ipcRenderer.invoke('urna:registrarVoto', eleicaoId, tipo, numeroDigitado),
  obterApuracao: (eleicaoId: number) => ipcRenderer.invoke('urna:obterApuracao', eleicaoId),
  excluirEleicao: (eleicaoId: number) => ipcRenderer.invoke('urna:excluirEleicao', eleicaoId)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}