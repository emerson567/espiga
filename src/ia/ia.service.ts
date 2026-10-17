import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export interface Mensaje {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class IaService {
  private readonly url = process.env.LOCAL_URL ?? 'http://localhost:11434/v1';
  private readonly llave = process.env.LOCAL_KEY ?? 'ollama';
  readonly modelo = process.env.LOCAL_MODELO ?? 'llama3.2';

  // Entrega la respuesta por partes, a medida que el modelo la genera.
  async *conversar(mensajes: Mensaje[]): AsyncGenerator<string> {
    const cuerpo = {
      model: this.modelo,
      messages: mensajes,
      temperature: 0.2,
      max_tokens: 300,
      stream: true,
    };
    let respuesta: Response;
    try {
      respuesta = await fetch(`${this.url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.llave}`,
        },
        body: JSON.stringify(cuerpo),
      });
    } catch {
      throw new ServiceUnavailableException(
        `No hay conexión con el modelo en ${this.url}`,
      );
    }
    if (!respuesta.ok || !respuesta.body) {
      throw new ServiceUnavailableException(
        `El modelo respondió HTTP ${respuesta.status}`,
      );
    }

    // El modelo envía líneas "data: {...}"; cada una trae un fragmento del texto.
    const lector = respuesta.body.pipeThrough(new TextDecoderStream()).getReader();
    let pendiente = '';
    for (;;) {
      const { value, done } = await lector.read();
      if (done) break;
      pendiente += value;
      const lineas = pendiente.split('\n');
      pendiente = lineas.pop() ?? '';
      for (const linea of lineas) {
        if (!linea.startsWith('data: ') || linea.includes('[DONE]')) continue;
        const parte = JSON.parse(linea.slice(6)).choices?.[0]?.delta?.content;
        if (parte) yield parte;
      }
    }
  }
}
