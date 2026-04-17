"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { PageShell } from "@/components/layout/page-shell";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  User, Mail, Building2, MapPin, Phone, Briefcase, Globe, 
  Linkedin, Twitter, Github, Shield, Key, Camera, Save,
  CheckCircle, XCircle, Clock, Calendar, Trash2, Download
} from "lucide-react";
import { toast } from "sonner";
import * as api from "@/lib/mock/api";
import type { UserProfile } from "@/types/domain";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tLang = useTranslations("language");
  const locale = useLocale();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getUserProfile();
        setProfile(res.data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleSaveProfile() {
    if (!profile) return;
    setSaving(true);
    try {
      await api.updateUserProfile(profile);
      toast.success(t("messages.saved"));
    } catch {
      toast.error(t("messages.error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (passwordData.new !== passwordData.confirm) {
      toast.error(t("security.passwordMismatch"));
      return;
    }
    if (passwordData.new.length < 8) {
      toast.error(t("security.passwordTooShort"));
      return;
    }
    try {
      // Simulate password change
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(t("security.passwordChanged"));
      setPasswordData({ current: "", new: "", confirm: "" });
    } catch {
      toast.error(t("messages.error"));
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <PageShell title={t("title")} description={t("description")}>
        <LoadingState rows={6} />
      </PageShell>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <PageShell title={t("title")} description={t("description")}>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Profile Sidebar */}
        <div className="space-y-6">
          {/* Avatar Card */}
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-primary/20">
                  {profile.avatarUrl ? (
                    <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                  onClick={() => toast.info(t("avatar.uploadInfo"))}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-foreground">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">{profile.jobTitle}</p>
              <div className="mt-2 flex items-center gap-2">
                {profile.emailVerified ? (
                  <Badge variant="outline" className="text-green-500 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t("verified")}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                    <XCircle className="h-3 w-3 mr-1" />
                    {t("unverified")}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("quickInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{profile.company}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{profile.department}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{profile.location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{profile.phone}</span>
              </div>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("accountInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">{t("memberSince")}</div>
                  <div className="text-foreground">{formatDate(profile.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">{t("lastLogin")}</div>
                  <div className="text-foreground">{formatDate(profile.lastLoginAt)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <Tabs defaultValue="general">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="general" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{t("tabs.general")}</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="gap-2">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">{t("tabs.contact")}</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{t("tabs.social")}</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">{t("tabs.security")}</span>
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("general.personalInfo")}</CardTitle>
                  <CardDescription>{t("general.personalInfoDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t("general.firstName")}</Label>
                      <Input
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) => setProfile(p => p && { ...p, firstName: e.target.value, name: `${e.target.value} ${p.lastName}` })}
                        className="bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t("general.lastName")}</Label>
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) => setProfile(p => p && { ...p, lastName: e.target.value, name: `${p.firstName} ${e.target.value}` })}
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">{t("general.bio")}</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile(p => p && { ...p, bio: e.target.value })}
                      className="bg-muted/50 min-h-[100px]"
                      placeholder={t("general.bioPlaceholder")}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("general.workInfo")}</CardTitle>
                  <CardDescription>{t("general.workInfoDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">{t("general.jobTitle")}</Label>
                      <Input
                        id="jobTitle"
                        value={profile.jobTitle}
                        onChange={(e) => setProfile(p => p && { ...p, jobTitle: e.target.value })}
                        className="bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">{t("general.department")}</Label>
                      <Input
                        id="department"
                        value={profile.department}
                        onChange={(e) => setProfile(p => p && { ...p, department: e.target.value })}
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company">{t("general.company")}</Label>
                      <Input
                        id="company"
                        value={profile.company}
                        onChange={(e) => setProfile(p => p && { ...p, company: e.target.value })}
                        className="bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">{t("general.location")}</Label>
                      <Input
                        id="location"
                        value={profile.location}
                        onChange={(e) => setProfile(p => p && { ...p, location: e.target.value })}
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? tCommon("states.loading") : tCommon("actions.save")}
                </Button>
              </div>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("contact.title")}</CardTitle>
                  <CardDescription>{t("contact.description")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("contact.email")}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile(p => p && { ...p, email: e.target.value })}
                        className="bg-muted/50"
                      />
                      {profile.emailVerified ? (
                        <Badge variant="outline" className="text-green-500 border-green-500/30 shrink-0">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t("verified")}
                        </Badge>
                      ) : (
                        <Button variant="outline" size="sm" className="shrink-0">
                          {t("contact.verify")}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("contact.phone")}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile(p => p && { ...p, phone: e.target.value })}
                      className="bg-muted/50"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("contact.preferences")}</CardTitle>
                  <CardDescription>{t("contact.preferencesDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t("contact.language")}</Label>
                      <Select 
                        value={profile.language} 
                        onValueChange={(v) => setProfile(p => p && { ...p, language: v })}
                      >
                        <SelectTrigger className="bg-muted/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="de">{tLang("de")}</SelectItem>
                          <SelectItem value="en">{tLang("en")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("contact.timezone")}</Label>
                      <Select 
                        value={profile.timezone} 
                        onValueChange={(v) => setProfile(p => p && { ...p, timezone: v })}
                      >
                        <SelectTrigger className="bg-muted/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Europe/Berlin">Berlin (UTC+1)</SelectItem>
                          <SelectItem value="Europe/London">London (UTC+0)</SelectItem>
                          <SelectItem value="Europe/Paris">Paris (UTC+1)</SelectItem>
                          <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Los Angeles (UTC-8)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo (UTC+9)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? tCommon("states.loading") : tCommon("actions.save")}
                </Button>
              </div>
            </TabsContent>

            {/* Social Tab */}
            <TabsContent value="social" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("social.title")}</CardTitle>
                  <CardDescription>{t("social.description")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="website" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {t("social.website")}
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={profile.website}
                      onChange={(e) => setProfile(p => p && { ...p, website: e.target.value })}
                      className="bg-muted/50"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-border rounded-l-md">
                        linkedin.com/in/
                      </span>
                      <Input
                        id="linkedin"
                        value={profile.linkedIn}
                        onChange={(e) => setProfile(p => p && { ...p, linkedIn: e.target.value })}
                        className="bg-muted/50 rounded-l-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      Twitter / X
                    </Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-border rounded-l-md">
                        @
                      </span>
                      <Input
                        id="twitter"
                        value={profile.twitter}
                        onChange={(e) => setProfile(p => p && { ...p, twitter: e.target.value })}
                        className="bg-muted/50 rounded-l-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github" className="flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      GitHub
                    </Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-border rounded-l-md">
                        github.com/
                      </span>
                      <Input
                        id="github"
                        value={profile.github}
                        onChange={(e) => setProfile(p => p && { ...p, github: e.target.value })}
                        className="bg-muted/50 rounded-l-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? tCommon("states.loading") : tCommon("actions.save")}
                </Button>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("security.twoFactor")}</CardTitle>
                  <CardDescription>{t("security.twoFactorDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${profile.twoFactorEnabled ? "bg-green-500/10" : "bg-muted"}`}>
                        <Shield className={`h-5 w-5 ${profile.twoFactorEnabled ? "text-green-500" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {profile.twoFactorEnabled ? t("security.twoFactorEnabled") : t("security.twoFactorDisabled")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {profile.twoFactorEnabled ? t("security.twoFactorEnabledDesc") : t("security.twoFactorDisabledDesc")}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={profile.twoFactorEnabled}
                      onCheckedChange={(checked) => {
                        setProfile(p => p && { ...p, twoFactorEnabled: checked });
                        toast.success(checked ? t("security.twoFactorActivated") : t("security.twoFactorDeactivated"));
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("security.changePassword")}</CardTitle>
                  <CardDescription>{t("security.changePasswordDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">{t("security.currentPassword")}</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.current}
                      onChange={(e) => setPasswordData(p => ({ ...p, current: e.target.value }))}
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">{t("security.newPassword")}</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.new}
                        onChange={(e) => setPasswordData(p => ({ ...p, new: e.target.value }))}
                        className="bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">{t("security.confirmPassword")}</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirm}
                        onChange={(e) => setPasswordData(p => ({ ...p, confirm: e.target.value }))}
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleChangePassword}
                    disabled={!passwordData.current || !passwordData.new || !passwordData.confirm}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {t("security.updatePassword")}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-destructive">{t("security.dangerZone")}</CardTitle>
                  <CardDescription>{t("security.dangerZoneDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <div className="font-medium text-foreground">{t("security.exportData")}</div>
                      <div className="text-sm text-muted-foreground">{t("security.exportDataDesc")}</div>
                    </div>
                    <Button variant="outline" onClick={() => toast.info(t("security.exportStarted"))}>
                      <Download className="h-4 w-4 mr-2" />
                      {t("security.export")}
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                    <div>
                      <div className="font-medium text-foreground">{t("security.deleteAccount")}</div>
                      <div className="text-sm text-muted-foreground">{t("security.deleteAccountDesc")}</div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t("security.delete")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("security.deleteConfirmTitle")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("security.deleteConfirmDesc")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{tCommon("actions.cancel")}</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => toast.error(t("security.deleteBlocked"))}
                          >
                            {t("security.deleteConfirm")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageShell>
  );
}
