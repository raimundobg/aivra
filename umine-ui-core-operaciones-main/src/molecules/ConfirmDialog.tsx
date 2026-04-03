import {
    Button,
    Text,
    Center,
    Circle,
} from "@chakra-ui/react";
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogCloseTrigger,
    DialogActionTrigger
} from "../components/ui/dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "info";
}

export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel,
    cancelLabel,
    variant = "danger"
}: ConfirmDialogProps) => {
    const { t } = useTranslation();

    return (
        <DialogRoot
            open={isOpen}
            onOpenChange={(e) => {
                if (!e.open) onClose();
            }}
            size="sm"
            placement="center"
            motionPreset="slide-in-bottom"
        >
            <DialogContent
                bg={{ base: "white", _dark: "rgba(15, 23, 42, 0.9)" }}
                backdropFilter="blur(24px)"
                borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}
                borderRadius="3xl"
                p="8"
                color={{ base: "slate.900", _dark: "white" }}
                boxShadow="2xl"
            >
                <DialogHeader>
                    <Center mb="6">
                        <Circle size="20" bg={variant === "danger" ? "status.error/10" : "brand.primary/10"} color={variant === "danger" ? "status.error" : "brand.primary"}>
                            {variant === "danger" ? <Trash2 size={40} /> : <AlertTriangle size={40} />}
                        </Circle>
                    </Center>
                    <DialogTitle textAlign="center" fontSize="2xl" fontWeight="black" letterSpacing="tight">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <DialogBody mt="2">
                    <Text textAlign="center" color="fg.muted" fontSize="md" lineHeight="relaxed">
                        {description}
                    </Text>
                </DialogBody>

                <DialogFooter mt="10" justifyContent="center" gap="4">
                    <DialogActionTrigger asChild>
                        <Button
                            variant="ghost"
                            color="fg.muted"
                            borderRadius="xl"
                            px="6"
                            fontWeight="bold"
                        >
                            {cancelLabel || t("common.cancel")}
                        </Button>
                    </DialogActionTrigger>
                    <Button
                        bg={variant === "danger" ? "status.error" : "button.primary.bg"}
                        _hover={{ bg: variant === "danger" ? "status.error" : "button.primary.hover", opacity: variant === "danger" ? 0.8 : 1, transform: "translateY(-1px)" }}
                        color="white"
                        borderRadius="xl"
                        px="10"
                        h="12"
                        fontWeight="black"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        transition="all 0.2s"
                        boxShadow={variant === "danger" ? "0 4px 12px rgba(220, 38, 38, 0.2)" : "0 4px 12px rgba(8, 145, 178, 0.2)"}
                    >
                        {confirmLabel || t("common.continue")}
                    </Button>
                </DialogFooter>
                <DialogCloseTrigger top="6" right="6" />
            </DialogContent>
        </DialogRoot>
    );
};
