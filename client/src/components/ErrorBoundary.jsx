import { Component } from 'react';
import PropTypes from 'prop-types';
import { btn } from '../utils/ui';

// Class component because React error boundaries have no hook equivalent
// (getDerivedStateFromError/componentDidCatch are class-only lifecycle APIs).
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-50 px-4 text-center dark:bg-zinc-950">
          <p className="font-display text-2xl font-bold text-zinc-900 dark:text-white">Something went wrong</p>
          <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            An unexpected error occurred. Try reloading the page.
          </p>
          <button type="button" className={btn()} onClick={this.handleReload}>
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
