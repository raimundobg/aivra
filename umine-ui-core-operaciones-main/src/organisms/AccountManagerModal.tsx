import React from 'react';
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogTitle,
} from '../components/ui/dialog';
import { VStack, Text, Icon, Button } from '@chakra-ui/react';
import { LinkButton } from '../components/ui/link-button';
import { Avatar } from '../components/ui/avatar';
import { Mail, Phone, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AccountManager } from '../services/accountManagerService';

interface AccountManagerModalProps {
    manager: AccountManager | null;
    isOpen: boolean;
    onClose: () => void;
}

const AccountManagerModal: React.FC<AccountManagerModalProps> = ({ manager, isOpen, onClose }) => {
    const { t } = useTranslation();

    if (!manager) return null;

    const cleanPhone = manager.phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    const emailUrl = `mailto:${manager.email}`;
    const telUrl = `tel:${manager.phone}`;

    return (
        <DialogRoot open={isOpen} onOpenChange={(details) => !details.open && onClose()} size="sm">
            <DialogContent
                bg={{ _light: "whiteAlpha.800", _dark: "gray.900" }}
                backdropFilter="blur(20px)"
                borderRadius="3xl"
                border="1px solid"
                borderColor="border.subtle"
                p="4"
                boxShadow="2xl"
            >
                <DialogHeader>
                    <DialogTitle fontSize="xl" fontWeight="bold">
                        {t('crm.account_manager_modal.title')}
                    </DialogTitle>
                </DialogHeader>

                <DialogBody pb="6">
                    <VStack gap="6" align="center" w="full">
                        <Avatar size="2xl" border="4px solid" borderColor="brand.primary/30" name={manager.name} />

                        <VStack gap="1" align="center">
                            <Text fontSize="2xl" fontWeight="bold">{manager.name}</Text>
                            <Text color="fg.muted" fontWeight="medium">{t('crm.fields.account_manager')}</Text>
                        </VStack>

                        <VStack gap="3" w="full">
                            {/* Email Action */}
                            <LinkButton
                                href={emailUrl}
                                variant="outline"
                                w="full"
                                h="14"
                                borderRadius="2xl"
                                justifyContent="start"
                                gap="4"
                                px="6"
                                _hover={{ bg: "bg.muted/50", textDecoration: "none", transform: "translateY(-2px)" }}
                                transition="all 0.2s"
                            >
                                <Icon color="blue.400"><Mail size={20} /></Icon>
                                <VStack align="start" gap="0">
                                    <Text fontSize="xs" color="fg.muted" fontWeight="bold">{t('crm.account_manager_modal.send_email')}</Text>
                                    <Text>{manager.email}</Text>
                                </VStack>
                            </LinkButton>

                            {/* WhatsApp Action */}
                            {manager.phone !== '-' && (
                                <LinkButton
                                    href={whatsappUrl}
                                    target="_blank"
                                    variant="outline"
                                    w="full"
                                    h="14"
                                    borderRadius="2xl"
                                    justifyContent="start"
                                    gap="4"
                                    px="6"
                                    _hover={{ bg: "green.400/10", textDecoration: "none", transform: "translateY(-2px)" }}
                                    transition="all 0.2s"
                                >
                                    <Icon color="green.400"><MessageSquare size={20} /></Icon>
                                    <VStack align="start" gap="0">
                                        <Text fontSize="xs" color="fg.muted" fontWeight="bold">{t('crm.account_manager_modal.send_whatsapp')}</Text>
                                        <Text>{manager.phone}</Text>
                                    </VStack>
                                </LinkButton>
                            )}

                            {/* Call Action */}
                            {manager.phone !== '-' && (
                                <LinkButton
                                    href={telUrl}
                                    variant="outline"
                                    w="full"
                                    h="14"
                                    borderRadius="2xl"
                                    justifyContent="start"
                                    gap="4"
                                    px="6"
                                    _hover={{ bg: "blue.400/10", textDecoration: "none", transform: "translateY(-2px)" }}
                                    transition="all 0.2s"
                                >
                                    <Icon color="blue.400"><Phone size={20} /></Icon>
                                    <VStack align="start" gap="0">
                                        <Text fontSize="xs" color="fg.muted" fontWeight="bold">{t('crm.account_manager_modal.call')}</Text>
                                        <Text>{manager.phone}</Text>
                                    </VStack>
                                </LinkButton>
                            )}
                        </VStack>
                    </VStack>
                </DialogBody>

                <DialogFooter px="4" pb="2">
                    <Button variant="ghost" w="full" onClick={onClose} borderRadius="xl">
                        {t('crm.account_manager_modal.close')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </DialogRoot>
    );
};

export default AccountManagerModal;
