import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.label}>Error:</Text>
            <Text style={styles.message}>{this.state.error?.toString()}</Text>
            <Text style={styles.label}>Stack Trace:</Text>
            <Text style={styles.stack}>{this.state.error?.stack}</Text>
            <Text style={styles.label}>Component Stack:</Text>
            <Text style={styles.stack}>{this.state.errorInfo?.componentStack}</Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: '#ff4444',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  scroll: {
    flex: 1,
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  label: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  message: {
    color: '#ff6b6b',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  stack: {
    color: '#cccccc',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  button: {
    backgroundColor: '#333333',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
