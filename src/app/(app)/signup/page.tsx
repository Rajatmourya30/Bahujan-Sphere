
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  country: z.string().min(2, 'Country is required.'),
  state: z.string().min(2, 'State is required.'),
  city: z.string().min(2, 'City is required.'),
  birthYear: z.coerce.number().min(1920, 'Please enter a valid year.').max(new Date().getFullYear() - 10, 'You must be at least 10 years old.'),
});

export default function SignupPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            country: '',
            state: '',
            city: '',
            birthYear: undefined,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;

            // Don't store the password in the database
            const { password, ...profileData } = values;

            await setDoc(doc(db, "users", user.uid), {
                ...profileData,
                birthYear: Number(profileData.birthYear) 
            });

            toast({
                title: t('signup_page.toast_success_title'),
                description: t('signup_page.toast_success_description'),
            });
            
            router.push('/profile');
        } catch (error: any) {
            let description = 'An unexpected error occurred. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                description = 'This email is already in use. Please login instead.';
            }
            toast({
                title: 'Sign Up Failed',
                description: description,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <div className="flex justify-center items-center h-full py-8">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">{t('signup_page.title')}</CardTitle>
                <CardDescription>{t('signup_page.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('signup_page.name_label')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('signup_page.name_placeholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('signup_page.email_label')}</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="m@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('signup_page.password_label')}</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="******" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('signup_page.country_label')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('signup_page.country_placeholder')} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="birthYear"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('signup_page.birth_year_label')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('signup_page.birth_year_placeholder')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {years.map(year => (
                                                    <SelectItem key={year} value={year.toString()}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('signup_page.state_label')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('signup_page.state_placeholder')} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('signup_page.city_label')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('signup_page.city_placeholder')} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('signup_page.submit_button')}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="text-center text-sm">
                {t('signup_page.login_prompt')}&nbsp;
                <Link href="/login" className="underline">
                    {t('signup_page.login_link')}
                </Link>
            </CardFooter>
        </Card>
    </div>
  );
}
