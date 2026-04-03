import { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Heading, Text, Button, VStack, HStack } from "@chakra-ui/react";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
        console.error("Uncaught error in boundary:", error);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: undefined });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Box
                    p="10"
                    borderRadius="3xl"
                    bg={{ base: "red.50", _dark: "red.500/5" }}
                    border="2px solid"
                    borderColor="red.500/20"
                    backdropFilter="blur(10px)"
                    my="4"
                >
                    <VStack spaceY="4" align="center" textAlign="center">
                        <AlertCircle size={48} color="var(--chakra-colors-red-500)" />
                        <Heading size="lg" color="red.500">Component Error</Heading>
                        <Text color="fg.muted" maxW="md">
                            Something went wrong while rendering this section. This is often due to an incompatible theme or missing data.
                        </Text>
                        {this.state.error && (
                            <Box bg="blackAlpha.200" p="3" borderRadius="md" fontSize="xs" fontFamily="mono" color="red.300">
                                {this.state.error.message}
                            </Box>
                        )}
                        <Button
                            colorPalette="gray"
                            bg="status.error"
                            color="white"
                            variant="outline"
                            onClick={this.handleReset}
                            borderRadius="full"
                            mt="2"
                        >
                            <HStack gap="2">
                                <RefreshCcw size={16} />
                                <Text>Reset Application</Text>
                            </HStack>
                        </Button>
                    </VStack>
                </Box>
            );
        }

        return this.props.children;
    }
}
