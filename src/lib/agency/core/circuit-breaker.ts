/**
 * Circuit Breaker Pattern
 * Protege contra falhas em cascata em APIs externas
 */

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Número de falhas antes de abrir
  successThreshold: number; // Número de sucessos para fechar
  timeout: number; // Tempo em ms antes de tentar novamente (half-open)
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttempt: number = Date.now();
  
  constructor(private config: CircuitBreakerConfig) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('[CircuitBreaker] Circuit is OPEN. Rejecting request.');
      }
      // Tempo expirou, tenta novamente
      this.state = CircuitState.HALF_OPEN;
      console.log('[CircuitBreaker] Transitioning to HALF_OPEN');
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        console.log('[CircuitBreaker] Circuit is now CLOSED');
      }
    }
  }
  
  private onFailure() {
    this.failureCount++;
    this.successCount = 0;
    
    if (
      this.failureCount >= this.config.failureThreshold ||
      this.state === CircuitState.HALF_OPEN
    ) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.config.timeout;
      console.error(
        `[CircuitBreaker] Circuit is now OPEN. Will retry after ${this.config.timeout}ms`
      );
    }
  }
  
  getState(): CircuitState {
    return this.state;
  }
  
  reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
  }
}

// Criar circuit breakers para diferentes serviços
export const openaiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 30000, // 30 segundos
});

export const anthropicCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 30000,
});

export const perplexityCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 1 minuto
});
