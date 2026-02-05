"use client";

// ============================================
// NOTÍCIAS DO SETOR - VALLE AI
// Carrossel 3D + Display Cards
// Cores: #001533 (navy), #1672d6 (primary), #ffffff (white)
// SEM ROXO - apenas cores da marca
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Newspaper, 
  TrendingUp, 
  Globe,
  Filter,
  Search,
  RefreshCw,
  ChevronRight,
  Clock,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Carousel3D } from "@/components/ui/carousel-3d";

// Dados de notícias
const newsData = [
  {
    id: "1",
    title: "Tendências de Marketing Digital para 2025",
    description: "Descubra as principais estratégias que vão dominar o mercado no próximo ano, incluindo IA generativa e personalização em escala.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    category: "Tendências",
    date: "04 Dez 2025",
    href: "/cliente/noticias/1"
  },
  {
    id: "2",
    title: "Como a IA Está Transformando o Marketing",
    description: "Inteligência artificial já é realidade nas estratégias de marketing. Veja como implementar na sua empresa.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
    category: "Tecnologia",
    date: "03 Dez 2025",
    href: "/cliente/noticias/2"
  },
  {
    id: "3",
    title: "Redes Sociais: Novidades do Algoritmo",
    description: "Instagram e TikTok atualizam seus algoritmos. Entenda o que muda para sua estratégia de conteúdo.",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
    category: "Redes Sociais",
    date: "02 Dez 2025",
    href: "/cliente/noticias/3"
  },
  {
    id: "4",
    title: "SEO em 2025: O Que Realmente Funciona",
    description: "Google atualiza critérios de ranqueamento. Confira as melhores práticas para seu site.",
    image: "https://images.unsplash.com/photo-1432888622747-4eb9a8f2cdc6?w=800&q=80",
    category: "SEO",
    date: "01 Dez 2025",
    href: "/cliente/noticias/4"
  },
  {
    id: "5",
    title: "E-commerce: Crescimento Recorde no Brasil",
    description: "Vendas online crescem 35% no último trimestre. Veja oportunidades para seu negócio.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    category: "Mercado",
    date: "30 Nov 2025",
    href: "/cliente/noticias/5"
  },
  {
    id: "6",
    title: "Conteúdo em Vídeo: Estratégias que Convertem",
    description: "Vídeos curtos dominam as redes. Aprenda a criar conteúdo que engaja e converte.",
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80",
    category: "Conteúdo",
    date: "29 Nov 2025",
    href: "/cliente/noticias/6"
  }
];

const categories = [
  { id: "all", label: "Todas", icon: Globe },
  { id: "tendencias", label: "Tendências", icon: TrendingUp },
  { id: "tecnologia", label: "Tecnologia", icon: Newspaper },
  { id: "mercado", label: "Mercado", icon: TrendingUp },
];

export default function NoticiasPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredNews = newsData.filter(news => {
    const matchesSearch = news.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "all" || 
      news.category.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-[#001533] dark:text-white">Notícias do Setor</h1>
        <p className="text-[#001533]/60 dark:text-white/60 mt-1">
          Acompanhe as últimas novidades do seu mercado
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#001533]/40 dark:text-white/40" />
          <Input
            placeholder="Buscar notícias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-[#001533]/20 dark:border-white/20 focus:border-[#1672d6] focus:ring-[#1672d6]/20"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            
            return (
              <Button
                key={category.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
                className={
                  isActive
                    ? "bg-[#1672d6] hover:bg-[#1672d6]/90 text-white"
                    : "border-[#001533]/20 dark:border-white/20 text-[#001533] dark:text-white hover:bg-[#1672d6]/10"
                }
              >
                <Icon className="size-4 mr-2" />
                {category.label}
              </Button>
            );
          })}
        </div>
      </motion.div>

      {/* Carrossel 3D */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-2xl border-2 border-[#001533]/10 dark:border-white/10 bg-gradient-to-b from-[#001533]/5 to-transparent dark:from-white/5 overflow-hidden py-8"
      >
        <h2 className="text-lg font-semibold text-[#001533] dark:text-white mb-4 px-6">
          Destaques da Semana
        </h2>
        <Carousel3D items={filteredNews.slice(0, 6)} />
      </motion.div>

      {/* Lista de Notícias */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-[#001533] dark:text-white mb-4">
          Todas as Notícias
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNews.map((news, index) => (
            <motion.div
              key={news.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link href={news.href || "#"}>
                <div className="group rounded-xl border-2 border-[#001533]/10 dark:border-white/10 bg-white dark:bg-[#001533]/50 overflow-hidden hover:shadow-lg hover:border-[#1672d6]/30 transition-all">
                  {/* Image */}
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={news.image} 
                      alt={news.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-[#1672d6] text-white text-xs">
                        {news.category}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-[#001533] dark:text-white group-hover:text-[#1672d6] transition-colors line-clamp-2 mb-2">
                      {news.title}
                    </h3>
                    <p className="text-sm text-[#001533]/60 dark:text-white/60 line-clamp-2 mb-3">
                      {news.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#001533]/50 dark:text-white/50 flex items-center gap-1">
                        <Clock className="size-3" />
                        {news.date}
                      </span>
                      <span className="text-[#1672d6] text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Ler mais <ChevronRight className="size-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Load More */}
      <div className="text-center pt-4">
        <Button 
          variant="outline" 
          className="border-[#1672d6]/30 text-[#1672d6] hover:bg-[#1672d6]/10"
        >
          <RefreshCw className="size-4 mr-2" />
          Carregar mais notícias
        </Button>
      </div>
    </div>
  );
}
